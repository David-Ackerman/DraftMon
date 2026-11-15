import { expect, test } from 'vitest'
import { resolveMoveEffects } from './move-effects'
import { givenBattle } from './testing/battle'

test('Ditto can damage a Ghost-type with Struggle and takes recoil', () => {
  const context = givenBattle()
    .withAttacker('ditto')
    .withDefender('gengar')
    .context()
  const ditto = context.current(0)
  expect(ditto.moves[0].name).toBe('struggle')
  const events = resolveMoveEffects(context, 0, ditto.moves[0])
  expect(events.slice(0, 2)).toMatchObject([
    { kind: 'damage', side: 1, mult: 1 },
    { kind: 'damage', side: 0, amount: Math.floor(ditto.maxHp / 4) },
  ])
})

test('drain follows damage and heals by the amount actually dealt', () => {
  const context = givenBattle()
    .withAttacker('bulbasaur', 'giga-drain')
    .context()
  context.current(0).hp = 1
  context.current(1).hp = 4
  const events = resolveMoveEffects(context, 0, context.current(0).moves[0])
  expect(events.map(({ kind }) => kind)).toEqual(['damage', 'heal', 'faint'])
  expect(context.current(0).hp).toBe(3)
})

test('a stat drop aimed at the user still applies when the move knocks out the target', () => {
  const context = givenBattle()
    .withAttacker('machamp', 'close-combat')
    .context()
  context.current(1).hp = 1
  const move = structuredClone(context.current(0).moves[0])
  if (!move.meta) throw new Error('Expected Close Combat metadata')
  move.meta.category.name = 'damage+raise'
  const events = resolveMoveEffects(context, 0, move)
  expect(events.map(({ kind }) => kind)).toEqual([
    'damage',
    'stat',
    'stat',
    'faint',
  ])
  expect(context.current(0).stages.defense).toBe(-1)
})
