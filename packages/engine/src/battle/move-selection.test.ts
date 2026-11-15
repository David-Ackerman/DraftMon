import { expect, test, vi } from 'vitest'
import { chooseMove } from './move-selection'
import { givenBattle } from './testing/battle'

test('uses one random weight per move and chooses coverage over an immune target', () => {
  const context = givenBattle()
    .withAttacker('pikachu', 'thunderbolt', 'swift')
    .withDefender('golem')
    .context()
  const rng = vi.fn(() => 0.5)
  expect(
    chooseMove(context.chart, context.current(0), context.current(1), rng).name,
  ).toBe('swift')
  expect(rng).toHaveBeenCalledTimes(2)
})
