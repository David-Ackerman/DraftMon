import { createHash, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createAccounts } from './accounts.mjs'
import { createBugReports } from './bug-reports.mjs'
import { fail, jsonStore, readBody } from './http-store.mjs'
import { advanceTournament, DEFAULT_ROUND_MINUTES, ROUND_MINUTES, startTournament, tournamentAction, tournamentReplay, tournamentView } from './tournament.mjs'
import { storagePaths } from './storage-paths.mjs'

const avatarIds = new Set(JSON.parse(readFileSync(new URL('../src/data/avatars.json', import.meta.url), 'utf8')).map(({ id }) => id))
const speciesIds = new Set(JSON.parse(readFileSync(new URL('../src/data/pokemon.json', import.meta.url), 'utf8')).map(({ species }) => species.name))
const ROOM_LIMIT = 16

function makeRound(ids) {
  const matches = []
  for (let index = 0; index < ids.length; index += 2) {
    const left = ids[index]
    const right = ids[index + 1] ?? null
    matches.push({ left, right, winner: right ? null : left })
  }
  return matches
}

function textField(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export function createLobbyHandler(file, loadEngine) {
  const paths = storagePaths(file)
  const store = jsonStore(paths.rooms, {})
  const accounts = createAccounts(paths.accounts)
  const pokedex = jsonStore(paths.pokedex, {})
  const bugReports = createBugReports(paths.rooms)

  function save(room) {
    room.revision = (room.revision ?? 0) + 1
    store.write({ ...store.read(), [room.code]: room })
  }

  function usageCounts(playerKey, progress) {
    const counts = { ...progress.counts }
    for (const room of Object.values(store.read())) {
      const member = room.members[playerKey]
      if (!member || !room.play) continue
      for (const round of room.play.rounds) {
        for (const { left, right, seen } of round.matches) {
          const visible = member.id === left ? seen?.[0] : member.id === right ? seen?.[1] : undefined
          for (const species of visible ?? []) counts[species] = (counts[species] ?? 0) + 1
        }
      }
    }
    return counts
  }

  function hasLegacyUsage(playerKey) {
    return Object.values(store.read()).some((room) => room.members[playerKey] && room.play?.rounds.some(({ matches }) =>
      matches.some((match) => match.replay && !match.seen)))
  }

  function restoreTournamentUsage(playerKey, engine) {
    for (const stored of Object.values(store.read())) {
      if (!stored.members[playerKey] || !stored.play) continue
      const room = structuredClone(stored)
      let changed = false
      for (const { matches } of room.play.rounds) {
        for (const match of matches) {
          if (match.seen || !match.replay) continue
          const { teams, seed } = match.replay
          const result = engine.battleTeams(teams[0], teams[1], seed, ['Player', 'Opponent'])
          match.seen = [engine.battleSpecies(result, 0), engine.battleSpecies(result, 1)]
          changed = true
        }
      }
      if (changed) save(room)
    }
  }

  const isDue = (room) => room?.play && room.play.phase !== 'complete' && (room.play.deadlineAt ?? 0) <= Date.now()

  async function expire() {
    if (!loadEngine || !Object.values(store.read()).some(isDue)) return
    const engine = await loadEngine()
    for (const stored of Object.values(store.read()).filter(isDue)) {
      const room = structuredClone(stored)
      if (advanceTournament(room, engine)) save(room)
    }
  }

  async function lobby(request, response, next) {
    const url = new URL(request.url ?? '/', 'http://localhost')
    const path = url.pathname
    if (path.startsWith('/api/bug-reports') && await bugReports(request, response, path)) return
    const authPath = path.startsWith('/api/auth/')
    const usagePath = path === '/api/profile/pokedex'
    if (!authPath && !usagePath && path !== '/api/rooms' && !path.startsWith('/api/rooms/')) return next()
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Cache-Control', 'no-store')
    const reply = (status, payload) => {
      response.writeHead(status)
      response.end(JSON.stringify(payload))
    }

    try {
      if (authPath) return reply(200, await accounts.handle(request, response, path))
      const account = accounts.identify(request)
      const secret = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.authorization ?? '')?.[1]
      if (!account && !secret) fail(401, 'Guest profile required.')
      const playerKey = account ? `account:${account.id}` : createHash('sha256').update(secret).digest('hex')
      const playerId = account?.id ?? secret.slice(0, 12).toUpperCase()
      if (usagePath) {
        if (url.searchParams.get('owner') !== `${account ? 'account' : 'guest'}:${playerId}`) fail(403, 'Profile not available.')
        const body = request.method === 'POST' ? await readBody(request) : undefined
        if (request.method !== 'GET' && !body) fail(405, 'Action not available.')
        if (loadEngine && hasLegacyUsage(playerKey)) restoreTournamentUsage(playerKey, await loadEngine())
        const data = pokedex.read()
        let progress = data[playerKey] ?? { counts: {}, battles: {} }
        if (body) {
          const { id, species } = body
          if (typeof id !== 'string' || !/^[a-f0-9]{32}$/.test(id) ||
              !Array.isArray(species) || !species.length || species.length > 6 ||
              species.some((name) => !speciesIds.has(name))) fail(400, 'Invalid battle history.')
          if (!progress.battles[id]) {
            const counts = { ...progress.counts }
            for (const name of new Set(species)) counts[name] = (counts[name] ?? 0) + 1
            progress = { counts, battles: { ...progress.battles, [id]: true } }
            pokedex.write({ ...data, [playerKey]: progress })
          }
        }
        return reply(200, { counts: usageCounts(playerKey, progress) })
      }
      const [, , , rawCode, action] = path.split('/')
      if (path.split('/').length > 5) fail(404, 'Room not found.')
      const code = rawCode?.toUpperCase()
      const method = request.method
      const body = method === 'POST' ? await readBody(request) : {}
      const usesEngine = ['start', 'catch', 'reroll', 'ready', 'replay'].includes(action) ||
        (code && Object.hasOwn(store.read(), code) && store.read()[code].members[playerKey] && isDue(store.read()[code]))
      const engine = usesEngine && loadEngine ? await loadEngine() : null
      const profile = () => {
        if (!avatarIds.has(body.avatar)) fail(400, 'Choose a valid trainer portrait.')
        return { id: playerId, name: textField(body.name, 24) || account?.username || 'Player', avatar: body.avatar }
      }
      let room = code && /^[A-F0-9]{8}$/.test(code) ? structuredClone(store.read()[code]) : undefined

      if (path === '/api/rooms' && method === 'POST') {
        const name = textField(body.nameOfRoom, 48)
        if (!name || !['room', 'tournament'].includes(body.kind)) fail(400, 'Enter a name and choose a room type.')
        let settings
        if (body.kind === 'tournament') {
          if (!account) fail(401, 'Sign in to create a tournament.')
          const { groups, bots, roundMinutes = DEFAULT_ROUND_MINUTES } = body
          if (typeof groups !== 'boolean' || !Number.isInteger(bots) || bots < 0 || bots > 8 ||
              !ROUND_MINUTES.includes(roundMinutes)) fail(400, 'Invalid tournament settings.')
          settings = { groups, bots, roundMinutes }
        }
        let newCode
        do { newCode = randomBytes(4).toString('hex').toUpperCase() } while (store.read()[newCode])
        room = { code: newCode, name, kind: body.kind, hostKey: playerKey, members: { [playerKey]: profile() }, rounds: [], champion: null, settings }
        save(room)
      } else {
        if (!room) fail(404, 'Room not found. Check the invite code.')
        const isHost = room.hostKey === playerKey
        const member = room.members[playerKey]
        if (method === 'POST' && action === 'join') {
          if (!member) {
            if (room.play || room.rounds.length) fail(409, 'This tournament has already started.')
            if (Object.keys(room.members).length + (room.settings?.bots ?? 0) >= ROOM_LIMIT) fail(409, 'This room is full.')
            if (Object.values(room.members).some(({ id }) => id === playerId)) fail(409, 'Guest ID already in use.')
          }
          if (!room.play) {
            room.members[playerKey] = profile()
            save(room)
          }
        } else {
          if (!member) fail(403, 'Join the room first.')
          if (engine && advanceTournament(room, engine)) save(room)
          if (method === 'POST' && action === 'start') {
            if (!isHost) fail(403, 'Only the host can start the tournament.')
            if (room.kind !== 'tournament' || room.play || room.rounds.length) fail(409, 'This tournament cannot be started.')
            if (room.settings) {
              if (!engine) fail(503, 'The tournament engine is unavailable.')
              startTournament(room, engine)
            } else {
              const ids = Object.values(room.members).map(({ id }) => id)
              if (ids.length < 2) fail(409, 'At least two guests must join.')
              room.rounds.push(makeRound(ids))
            }
            save(room)
          } else if (method === 'POST' && action === 'result' && !room.settings) {
            if (!isHost) fail(403, 'Only the host can record results.')
            const round = room.rounds.at(-1)
            const match = round?.[body.match]
            if (body.round !== room.rounds.length - 1 || !Number.isInteger(body.match) || !match || match.winner || !match.right ||
              (body.winner !== match.left && body.winner !== match.right)) fail(409, 'This match cannot accept that result.')
            match.winner = body.winner
            if (round.every(({ winner }) => winner)) {
              if (round.length === 1) room.champion = body.winner
              else room.rounds.push(makeRound(round.map(({ winner }) => winner)))
            }
            save(room)
          } else if (method === 'POST' && ['catch', 'reroll', 'ready'].includes(action)) {
            if (!engine) fail(503, 'The tournament engine is unavailable.')
            tournamentAction(room, playerId, action, body, engine)
            save(room)
          } else if (method === 'GET' && action === 'replay') {
            if (!engine) fail(503, 'The tournament engine is unavailable.')
            return reply(200, tournamentReplay(room.play, playerId, Object.fromEntries(url.searchParams), engine))
          } else if (method !== 'GET' || action) {
            fail(404, 'Room action not found.')
          }
        }
      }

      reply(200, {
        code: room.code, name: room.name, kind: room.kind, revision: room.revision,
        host: room.members[room.hostKey].id, members: Object.values(room.members), selfId: playerId,
        settings: room.settings, rounds: room.rounds, champion: room.champion,
        play: room.play ? tournamentView(room.play, playerId) : undefined,
      })
    } catch (error) {
      if (!error.status) console.error(error)
      reply(error.status ?? 500, { error: error.status ? error.message : 'The lobby could not save or load that request.' })
    }
  }
  return Object.assign(lobby, { expire })
}
