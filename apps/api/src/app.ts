import { Hono } from 'hono'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { gameData } from '@draftmon/content'
import { createTournamentEngine } from '@draftmon/engine'
import { memoryDatabase } from '@draftmon/db'
import type { Database } from '@draftmon/db'
import { createAccounts } from './auth/accounts'
import type { ResetMailer } from './auth/accounts'
import { HttpError } from './http'
import { mountAccountRoutes } from './routes/accounts'
import { mountBugReportRoutes, readBugReport } from './routes/bug-reports'
import { mountLobbyRoutes } from './routes/lobbies'
import { mountProgressRoutes } from './routes/progress'
import type { AppBindings } from './routes/transport'
import { createBugReports } from './services/bug-reports'
import { createLobbies } from './services/lobbies'
import { createIdentifyPlayer } from './services/players'
import { createProgress } from './services/progress'
import { createState } from './state'

type AppOptions = {
  database?: Database
  screenshotDirectory?: string
  clock?: () => number
  randomHex?: (size: number) => string
  sendReset?: ResetMailer | null
}

export function createApp({
  database = memoryDatabase(),
  screenshotDirectory = process.env.POKE_BATTLE_SCREENSHOT_DIRECTORY ||
    fileURLToPath(
      new URL('../../../.poke-battle/bug-screenshots', import.meta.url),
    ),
  clock = Date.now,
  randomHex = (size) => randomBytes(size).toString('hex'),
  sendReset,
}: AppOptions = {}) {
  const app = new Hono<AppBindings>()
  const state = createState(database)
  const engine = createTournamentEngine(gameData)
  const accounts = createAccounts(state.openStore('accounts'), {
    clock,
    sendReset,
    afterCommit: state.afterCommit,
  })
  const identify = createIdentifyPlayer(accounts)
  const rooms = state.openStore('rooms')
  const lobbies = createLobbies(rooms, engine, clock, randomHex)
  const progress = createProgress(
    state.openStore('pokedex'),
    rooms,
    lobbies.save,
    engine,
  )
  const reports = createBugReports(
    screenshotDirectory,
    process.env,
    fetch,
    readBugReport,
    database.recordBugReport,
  )

  app.use('/api/*', async (context, next) => {
    await next()
    context.header('Cache-Control', 'no-store')
    context.header('X-Content-Type-Options', 'nosniff')
    context.header('Referrer-Policy', 'no-referrer')
  })
  mountAccountRoutes(app, state, accounts)
  mountLobbyRoutes(app, state, identify, lobbies)
  mountProgressRoutes(app, state, identify, progress)
  mountBugReportRoutes(app, reports)
  app.get('/healthz', (context) => context.json({ ok: true }))
  app.all('/api/*', (context) =>
    context.json({ error: 'Route not found.' }, 404),
  )
  app.onError((error, context) => {
    if (error instanceof HttpError)
      return Response.json({ error: error.message }, { status: error.status })
    console.error('Draftmon API request failed.', error.name)
    return context.json(
      { error: 'The lobby could not save or load that request.' },
      500,
    )
  })
  return { app, expire: () => state.transaction(['rooms'], lobbies.expire) }
}
