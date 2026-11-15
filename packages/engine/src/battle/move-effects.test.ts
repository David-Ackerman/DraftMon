import { expect, test } from 'vitest'
import { resolveMoveEffects } from './move-effects'
import { givenBattle } from './testing/battle'

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
