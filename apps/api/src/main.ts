import { serve } from '@hono/node-server'
import { openDatabase } from '@draftmon/db'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './app'
import { startExpirationJob } from './jobs/expire-tournaments'

const port = Number(process.env.PORT || 4000)
const hostname = process.env.HOST || '127.0.0.1'
const directory =
  process.env.POKE_BATTLE_DB_DIRECTORY ||
  fileURLToPath(new URL('../../../.poke-battle/postgres', import.meta.url))
if (!process.env.DATABASE_URL)
  await mkdir(dirname(directory), { recursive: true })
const database = await openDatabase({
  url: process.env.DATABASE_URL,
  directory,
})
const { app, expire } = createApp({ database })
const server = serve({ fetch: app.fetch, port, hostname }, (info) => {
  console.log(`Draftmon listening on http://${hostname}:${info.port}`)
})
const stopExpiration = startExpirationJob(expire)
function shutdown() {
  stopExpiration()
  server.close(() => {
    void database.close().catch(console.error)
  })
}
process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
