import { expect, test, vi } from 'vitest'
import { shufflePokemon } from '../src/engine/tournament'
import { advanceTournament, startTournament, tournamentAction, tournamentView } from './tournament.mjs'

const team = ['one', 'two', 'three', 'four', 'five', 'six']
const humans = [
  { id: 'A', name: 'Trainer A' },
  { id: 'B', name: 'Trainer B' },
  { id: 'C', name: 'Trainer C' },
]
const engine = () => ({
  botProfiles: (_seed, count) => count ? [{ id: 'bot', name: 'Bot', bot: true, team }] : [],
  draftRoll: (_seed, current) => ({ options: team.filter((pokemon) => !current.includes(pokemon)) }),
  shufflePokemon,
  battleTeams: vi.fn(() => ({ winner: 0 })),
  battleSpecies: () => [],
})

function roomWith(count, groups = false, bots = 0) {
  return { members: humans.slice(0, count), settings: { roundMinutes: 5, groups, bots } }
}

function draft(room, engine, id) {
  team.forEach((pokemon, pick) => tournamentAction(room, id, 'catch', { pokemon, pick, rerolls: 3 }, engine))
}

test('the deadline fills only open draft slots and starts a fresh round timer', () => {
  const room = roomWith(2, false, 1)
  const battle = engine()
  startTournament(room, battle, 1000)
  draft(room, battle, 'A')
  tournamentAction(room, 'B', 'catch', { pokemon: 'six', pick: 0, rerolls: 3 }, battle)
  const expected = shufflePokemon(`${room.play.seed}:B:autocatch:1`, room.play.drafts.B.roll.options)[0]
  expect(advanceTournament(room, battle, 300_999)).toBe(false)
  expect(room.play.drafts.B.team).toEqual(['six'])
  expect(advanceTournament(room, battle, 301_000)).toBe(true)
  expect(tournamentView(room.play, 'A')).toMatchObject({
    phase: 'knockout', deadlineAt: 601_000,
  })
  expect(tournamentView(room.play, 'A').self.team).toEqual(team)
  const finished = tournamentView(room.play, 'B').self
  expect(finished.team.slice(0, 2)).toEqual(['six', expected])
  expect([...finished.team].sort()).toEqual([...team].sort())
  expect(finished.roll).toBeNull()
  expect(() => tournamentAction(room, 'B', 'catch', { pokemon: team[0], pick: 0, rerolls: 3 }, battle)).toThrow(/changed/)
  expect(battle.battleTeams).not.toHaveBeenCalled()
})

test('when both players time out, they still battle in groups and in the final', () => {
  const room = roomWith(2, true)
  const battle = engine()
  startTournament(room, battle)
  draft(room, battle, 'A')
  draft(room, battle, 'B')
  advanceTournament(room, battle, room.play.deadlineAt)
  expect(tournamentView(room.play, 'A')).toMatchObject({
    phase: 'knockout', participants: [{ wins: 1 }, { wins: 0 }],
    rounds: [{ matches: [{ winner: 'A', watch: true }] }, { matches: [{ winner: null }] }],
  })
  expect(battle.battleTeams).toHaveBeenCalledOnce()
  expect(battle.battleTeams.mock.calls[0].slice(0, 2)).toEqual(['A', 'B'].map((id) =>
    shufflePokemon(`${room.play.seed}:autolineup:0:${id}`, team)))
  expect(room.play.orders).toEqual({})
  advanceTournament(room, battle, room.play.deadlineAt)
  expect(tournamentView(room.play, 'A')).toMatchObject({ phase: 'complete', champion: 'A' })
  expect(battle.battleTeams).toHaveBeenCalledTimes(2)
})

test('an automatic lineup faces the opponent who submitted their own order', () => {
  const room = roomWith(3)
  const battle = engine()
  startTournament(room, battle)
  for (const { id } of humans) draft(room, battle, id)
  for (const id of ['A', 'B']) tournamentAction(room, id, 'ready', { round: 0, order: team }, battle)
  expect(battle.battleTeams).toHaveBeenCalledOnce()
  expect(tournamentView(room.play, 'A').rounds[0].matches[0]).toMatchObject({ winner: 'A', watch: true })
  const manual = [...team].reverse()
  tournamentAction(room, 'C', 'ready', { round: 1, order: manual }, battle)
  advanceTournament(room, battle, room.play.deadlineAt)
  expect(battle.battleTeams.mock.calls[1].slice(0, 2)).toEqual([
    shufflePokemon(`${room.play.seed}:autolineup:1:A`, team), manual,
  ])
  expect(tournamentView(room.play, 'C')).toMatchObject({ champion: 'A' })
  expect(tournamentView(room.play, 'C').rounds[1].matches[0]).toMatchObject({ winner: 'A', watch: true })
})
