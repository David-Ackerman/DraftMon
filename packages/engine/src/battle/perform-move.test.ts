import { expect, test } from 'vitest'
import { performMove } from './perform-move'
import { givenBattle } from './testing/battle'

test('reports a miss without applying any effects', () => {
  const context = givenBattle()
    .withAttacker('pikachu', 'thunder')
    .context(() => 0.99)
  const hp = context.current(1).hp
  expect(
    performMove(context, 0, context.current(0).moves[0]).map(
      ({ kind }) => kind,
    ),
  ).toEqual(['move', 'miss'])
  expect(context.current(1).hp).toBe(hp)
})
