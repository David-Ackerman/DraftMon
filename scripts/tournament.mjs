import { randomBytes } from 'node:crypto'
import { fail } from './http-store.mjs'

const TEAM_SIZE = 6
const REROLLS = 3
const LEVEL = 50
export const DEFAULT_ROUND_MINUTES = 10
export const ROUND_MINUTES = [5, 10, 15, 30, 60]

function groupRounds(ids) {
  const rotation = ids.length % 2 ? [...ids, null] : [...ids]
  return Array.from({ length: rotation.length - 1 }, () => {
    const pairs = rotation.slice(0, rotation.length / 2).flatMap((left, index) => {
      const right = rotation[rotation.length - 1 - index]
      return left && right ? [{ left, right, winner: null }] : []
    })
    rotation.splice(1, 0, rotation.pop())
    return pairs
  })
}

export function startTournament(room, engine, now = Date.now()) {
  const humans = Object.values(room.members)
  if (humans.length + room.settings.bots < 2) fail(409, 'At least two participants are required.')
  const seed = randomBytes(16).toString('hex')
  const bots = engine.botProfiles(seed, room.settings.bots)
  const participants = [...humans, ...bots.map(({ team: _team, ...bot }) => bot)]
  const drafts = Object.fromEntries(humans.map(({ id }) => [id, {
    team: [], rerollsLeft: REROLLS, roll: engine.draftRoll(`${seed}:${id}`, [], REROLLS),
  }]))
  for (const bot of bots) drafts[bot.id] = { team: bot.team, rerollsLeft: 0, roll: null }
  const roundMs = (room.settings.roundMinutes ?? DEFAULT_ROUND_MINUTES) * 60_000
  room.play = { seed, phase: 'draft', participants, drafts, pendingGroups: room.settings.groups ? groupRounds(participants.map(({ id }) => id)) : [], rounds: [], orders: {}, champion: null, roundMs, deadlineAt: now + roundMs }
}

function addRound(play, type, matches, now) {
  play.phase = type
  play.orders = {}
  play.deadlineAt = now + play.roundMs
  play.rounds.push({ type, matches })
}

function finish(play, champion) {
  play.champion = champion
  play.phase = 'complete'
  play.deadlineAt = null
}

function knockout(play, ids, now) {
  if (ids.length < 2) return finish(play, ids[0] ?? null)
  const matches = []
  for (let i = 0; i < ids.length; i += 2) {
    matches.push({ left: ids[i], right: ids[i + 1] ?? null, winner: ids[i + 1] ? null : ids[i] })
  }
  addRound(play, 'knockout', matches, now)
}

function tally(play) {
  const wins = new Map(play.participants.map(({ id }) => [id, 0]))
  for (const round of play.rounds) {
    if (round.type !== 'groups') continue
    for (const { winner } of round.matches) if (winner) wins.set(winner, wins.get(winner) + 1)
  }
  return wins
}

function scheduleFirstRound(play, now) {
  if (play.pendingGroups.length) addRound(play, 'groups', play.pendingGroups.shift(), now)
  else knockout(play, play.participants.map(({ id }) => id), now)
}

function resolveReadyRounds(play, engine, now) {
  const botIds = new Set(play.participants.filter(({ bot }) => bot).map(({ id }) => id))
  const members = new Map(play.participants.map((player) => [player.id, player]))
  while (play.phase === 'groups' || play.phase === 'knockout') {
    const round = play.rounds.at(-1)
    const pending = round.matches.filter(({ right }) => right)
    const ready = (id) => botIds.has(id) || Boolean(play.orders[id])
    if (pending.some(({ left, right }) => !ready(left) || !ready(right))) return
    for (const [slot, match] of round.matches.entries()) {
      if (!match.right) continue
      const ids = [match.left, match.right]
      const names = ids.map((id) => members.get(id).name)
      const teams = ids.map((id) => play.orders[id] ?? play.drafts[id].team)
      const seed = `${play.seed}:round:${play.rounds.length - 1}:${slot}`
      const result = engine.battleTeams(teams[0], teams[1], seed, names)
      match.winner = ids[result.winner]
      match.replay = { teams, seed }
      match.seen = [engine.battleSpecies(result, 0), engine.battleSpecies(result, 1)]
    }

    if (play.pendingGroups.length) addRound(play, 'groups', play.pendingGroups.shift(), now)
    else if (round.type === 'groups') {
      const wins = tally(play)
      const ids = [...wins.keys()].filter((id) => !play.draftForfeits?.includes(id))
        .sort((left, right) => wins.get(right) - wins.get(left))
      knockout(play, ids.slice(0, Math.max(2, Math.ceil(ids.length / 2))), now)
    } else if (round.matches.length === 1) {
      finish(play, round.matches[0].winner)
    } else knockout(play, round.matches.map(({ winner }) => winner).filter(Boolean), now)
  }
}

function catchPokemon(draft, pokemon, seed, engine) {
  draft.team.push(pokemon)
  draft.roll = draft.team.length === TEAM_SIZE ? null : engine.draftRoll(seed, draft.team, draft.rerollsLeft)
}

export function advanceTournament(room, engine, now = Date.now()) {
  const play = room.play
  if (!play || play.phase === 'complete') return false
  // Rooms saved before deadlines receive a full window when first loaded.
  if (play.deadlineAt == null) {
    play.roundMs = (room.settings?.roundMinutes ?? DEFAULT_ROUND_MINUTES) * 60_000
    play.deadlineAt = now + play.roundMs
    return true
  }
  if (now < play.deadlineAt) return false
  if (play.phase === 'draft') {
    for (const { id } of play.participants) {
      const draft = play.drafts[id]
      const seed = `${play.seed}:${id}`
      while (draft.roll) {
        const [pokemon] = engine.shufflePokemon(`${seed}:autocatch:${draft.team.length}`, draft.roll.options)
        catchPokemon(draft, pokemon, seed, engine)
      }
    }
    scheduleFirstRound(play, now)
  } else {
    const round = play.rounds.length - 1
    const matched = new Set(play.rounds[round].matches.flatMap(({ left, right }) => right ? [left, right] : []))
    for (const { id, bot } of play.participants) {
      if (!bot && matched.has(id) && !play.orders[id]) {
        play.orders[id] = engine.shufflePokemon(`${play.seed}:autolineup:${round}:${id}`, play.drafts[id].team)
      }
    }
  }
  resolveReadyRounds(play, engine, now)
  return true
}

export function tournamentAction(room, id, action, body, engine) {
  const play = room.play
  if (!play) fail(409, 'Start the tournament first.')
  const draft = play.drafts[id]
  if (action === 'catch' || action === 'reroll') {
    // Each private action references the exact offer the player saw.
    if (play.phase !== 'draft' || !draft?.roll || draft.team.length !== body.pick || draft.rerollsLeft !== body.rerolls) {
      fail(409, 'This draft offer has changed.')
    }
    const seed = `${play.seed}:${id}`
    if (action === 'catch') {
      if (!draft.roll.options.includes(body.pokemon)) fail(400, 'Choose a Pokémon from your current offer.')
      catchPokemon(draft, body.pokemon, seed, engine)
      if (Object.values(play.drafts).every(({ team }) => team.length === TEAM_SIZE)) {
        const now = Date.now()
        scheduleFirstRound(play, now)
        resolveReadyRounds(play, engine, now)
      }
    } else {
      if (!draft.rerollsLeft || !['type', 'region', 'both'].includes(body.mode)) fail(409, 'This reroll is unavailable.')
      draft.rerollsLeft--
      draft.roll = engine.draftRoll(seed, draft.team, draft.rerollsLeft, body.mode, draft.roll)
    }
    return
  }

  if (action !== 'ready' || !['groups', 'knockout'].includes(play.phase) || body.round !== play.rounds.length - 1) {
    fail(409, 'This tournament round has changed.')
  }
  if (!play.rounds.at(-1).matches.some(({ left, right }) => right && (left === id || right === id))) {
    fail(409, 'You have no match in this round.')
  }
  if (play.orders[id]) return // A retry cannot replace the submitted order.
  if (!Array.isArray(body.order) || body.order.length !== TEAM_SIZE || new Set(body.order).size !== TEAM_SIZE ||
      !body.order.every((name) => draft.team.includes(name))) fail(400, 'Submit your six drafted Pokémon in battle order.')
  play.orders[id] = body.order
  resolveReadyRounds(play, engine, Date.now())
}

function canWatch(match, id, botIds) {
  return Boolean(match.replay && (match.left === id || match.right === id || botIds.has(match.left) || botIds.has(match.right)))
}

export function tournamentView(play, id) {
  const bots = new Set(play.participants.filter(({ bot }) => bot).map(({ id }) => id))
  const wins = tally(play)
  return {
    phase: play.phase,
    champion: play.champion,
    deadlineAt: play.deadlineAt,
    participants: play.participants.map((member) => ({
      ...member, ready: play.phase === 'draft' ? play.drafts[member.id].team.length === TEAM_SIZE : bots.has(member.id) || Boolean(play.orders[member.id]),
      wins: wins.get(member.id),
      draftForfeit: play.draftForfeits?.includes(member.id) ?? false,
    })),
    rounds: play.rounds.map(({ type, matches }) => ({
      type,
      matches: matches.map(({ left, right, winner, replay, forfeit }) => ({ left, right, winner, forfeit, watch: canWatch({ left, right, replay }, id, bots) })),
    })),
    self: play.drafts[id],
    ready: Boolean(play.orders[id]),
  }
}

export function tournamentReplay(play, id, query, engine) {
  const round = Number(query.round)
  const slot = Number(query.slot)
  if (query.round === undefined || query.slot === undefined || !Number.isInteger(round) || !Number.isInteger(slot)) fail(404, 'Replay not available.')
  const match = play?.rounds[round]?.matches[slot]
  const players = play?.participants ?? []
  const bots = new Set(players.filter(({ bot }) => bot).map(({ id }) => id))
  if (!match || !canWatch(match, id, bots)) fail(404, 'Replay not available.')
  const left = players.find(({ id }) => id === match.left)
  const right = players.find(({ id }) => id === match.right)
  const { teams, seed } = match.replay
  return { left, right, level: LEVEL, result: engine.battleTeams(teams[0], teams[1], seed, [left.name, right.name], true) }
}
