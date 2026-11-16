import { avatars } from '@draftmon/content'
import {
  DEFAULT_TOURNAMENT_PLAYERS,
  tournamentHumanLimit,
} from '@draftmon/contracts'
import type { RoomBody } from '@draftmon/contracts'
import { fail } from '../http'
import type { Match, Room, Store, TournamentEngine } from '../models'
import type { Player } from './players'
import {
  advanceTournament,
  DEFAULT_ROUND_MINUTES,
  startTournament,
  tournamentAction,
  tournamentReplay,
  tournamentView,
} from './tournament'

const avatarIds = new Set(avatars.map(({ id }) => id))
const textField = (value: string | undefined, max: number) =>
  value?.trim().slice(0, max) ?? ''
const isDue = (room: Room, now: number) =>
  room.play &&
  room.play.phase !== 'complete' &&
  (room.play.deadlineAt ?? 0) <= now

function makeRound(ids: string[]) {
  const matches: Match[] = []
  for (let index = 0; index < ids.length; index += 2) {
    const left = ids[index]
    const right = ids[index + 1] ?? null
    matches.push({ left, right, winner: right ? null : left })
  }
  return matches
}

function profile(player: Player, body: RoomBody<'join'>) {
  if (!avatarIds.has(body.avatar)) fail(400, 'Choose a valid trainer portrait.')
  return {
    id: player.id,
    name: textField(body.name, 24) || player.account?.username || 'Player',
    avatar: body.avatar,
  }
}

function roomView(room: Room, selfId: string) {
  return {
    code: room.code,
    name: room.name,
    kind: room.kind,
    revision: room.revision,
    host: room.members[room.hostKey].id,
    members: Object.values(room.members),
    selfId,
    settings: room.settings,
    rounds: room.rounds,
    champion: room.champion,
    play: room.play ? tournamentView(room.play, selfId) : undefined,
  }
}

export function createLobbies(
  store: Store<Record<string, Room>>,
  engine: TournamentEngine,
  clock: () => number,
  randomHex: (size: number) => string,
) {
  function save(room: Room) {
    room.revision = (room.revision ?? 0) + 1
    store.write({ ...store.read(), [room.code]: room })
  }

  function create(player: Player, body: RoomBody<'create'>) {
    const name = textField(body.nameOfRoom, 48)
    if (!name) fail(400, 'Enter a name and choose a room type.')
    const settings =
      body.kind === 'tournament'
        ? {
            groups: body.groups,
            bots: body.bots,
            minimumPlayers:
              body.minimumPlayers ??
              (body.bots === undefined
                ? DEFAULT_TOURNAMENT_PLAYERS
                : undefined),
            roundMinutes: body.roundMinutes ?? DEFAULT_ROUND_MINUTES,
          }
        : undefined
    let code: string
    do {
      code = randomHex(4).toUpperCase()
    } while (store.read()[code])
    const room: Room = {
      code,
      name,
      kind: body.kind,
      hostKey: player.key,
      members: { [player.key]: profile(player, body) },
      rounds: [],
      champion: null,
      settings,
    }
    save(room)
    return roomView(room, player.id)
  }

  function find(code: string) {
    const key = code.toUpperCase()
    const room = /^[A-F0-9]{8}$/.test(key)
      ? structuredClone(store.read()[key])
      : undefined
    if (!room) fail(404, 'Room not found. Check the invite code.')
    return room
  }

  function joined(player: Player, code: string) {
    const room = find(code)
    if (!room.members[player.key]) fail(403, 'Join the room first.')
    if (isDue(room, clock()) && advanceTournament(room, engine, clock()))
      save(room)
    return room
  }

  function join(player: Player, code: string, body: RoomBody<'join'>) {
    const room = find(code)
    if (!room.members[player.key]) {
      if (room.play || room.rounds.length)
        fail(409, 'This tournament has already started.')
      if (
        Object.keys(room.members).length >= tournamentHumanLimit(room.settings)
      )
        fail(409, 'This room is full.')
      if (Object.values(room.members).some(({ id }) => id === player.id))
        fail(409, 'Guest ID already in use.')
    }
    if (!room.play) {
      room.members[player.key] = profile(player, body)
      save(room)
    }
    return roomView(room, player.id)
  }

  function start(player: Player, code: string) {
    const room = joined(player, code)
    if (room.hostKey !== player.key)
      fail(403, 'Only the host can start the tournament.')
    if (room.play || room.rounds.length)
      fail(409, 'This tournament cannot be started.')
    if (room.kind === 'room') {
      room.kind = 'tournament'
      room.settings = {
        groups: false,
        minimumPlayers: DEFAULT_TOURNAMENT_PLAYERS,
        roundMinutes: DEFAULT_ROUND_MINUTES,
      }
    }
    room.settings ??= { groups: false, roundMinutes: DEFAULT_ROUND_MINUTES }
    startTournament(room, engine, clock(), randomHex(16))
    save(room)
    return roomView(room, player.id)
  }

  function result(player: Player, code: string, body: RoomBody<'result'>) {
    const room = joined(player, code)
    if (room.settings) fail(404, 'Room action not found.')
    if (room.hostKey !== player.key)
      fail(403, 'Only the host can record results.')
    const round = room.rounds.at(-1)
    const match = round?.[body.match]
    if (
      body.round !== room.rounds.length - 1 ||
      !round ||
      !match ||
      match.winner ||
      !match.right ||
      (body.winner !== match.left && body.winner !== match.right)
    )
      fail(409, 'This match cannot accept that result.')
    match.winner = body.winner
    const winners = round.flatMap(({ winner }) => (winner ? [winner] : []))
    if (winners.length === round.length) {
      if (round.length === 1) room.champion = body.winner
      else room.rounds.push(makeRound(winners))
    }
    save(room)
    return roomView(room, player.id)
  }

  function act(
    player: Player,
    code: string,
    command: Parameters<typeof tournamentAction>[2],
  ) {
    const room = joined(player, code)
    tournamentAction(room, player.id, command, engine, clock())
    save(room)
    return roomView(room, player.id)
  }

  function expire() {
    const now = clock()
    for (const stored of Object.values(store.read())) {
      if (!isDue(stored, now)) continue
      const room = structuredClone(stored)
      if (advanceTournament(room, engine, now)) save(room)
    }
  }

  return {
    create,
    join,
    start,
    result,
    act,
    expire,
    save,
    get: (player: Player, code: string) =>
      roomView(joined(player, code), player.id),
    replay: (player: Player, code: string, query: Record<string, string>) =>
      tournamentReplay(joined(player, code).play, player.id, query, engine),
  }
}

export type Lobbies = ReturnType<typeof createLobbies>
