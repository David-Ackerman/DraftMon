import { expect, it } from 'vitest'
import { gameData } from '@draftmon/content'
import { simulateBattle } from '@draftmon/engine'
import { createRng } from '@draftmon/engine'
import { chart } from '../../services/chart'
import { viewAt } from './battleState'

it('a creature can carry a status and several stat badges at once', () => {
  // status-heavy and boosting teams so effects stack
  const a = [{ name: 'venusaur', moves: ['toxic'] }]
  const b = [{ name: 'dragonite', moves: ['dragon-dance', 'dragon-claw'] }]
  let found = false
  for (let seed = 0; seed < 200 && !found; seed++) {
    const res = simulateBattle(a, b, {
      data: gameData,
      chart,
      rng: createRng(seed),
      levels: [50, 50],
    })
    for (let i = 0; i < res.events.length && !found; i++) {
      const v = viewAt(res, i)
      for (const side of [0, 1] as const) {
        const slot = v.active[side]
        const stages = Object.values(v.stages[side][slot]).filter(
          (x) => x !== 0,
        )
        if (v.status[side][slot] && stages.length >= 2) found = true
      }
    }
  }
  expect(found).toBe(true)
})
