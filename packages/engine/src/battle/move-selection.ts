import type { ApiMove } from '@draftmon/content'
import type { Rng } from '../rng'
import type { TypeChart } from '../typeChart'
import { effectiveStat } from './damage'
import { scoreMove } from './move-scorers'
import type { BattleMon } from './types'

/** Picks the move with the best expected value against the current target. */
export function chooseMove(
  chart: TypeChart,
  user: BattleMon,
  target: BattleMon,
  rng: Rng,
): ApiMove {
  const userFaster =
    effectiveStat(user, 'speed') >= effectiveStat(target, 'speed')
  const context = { chart, user, target, userFaster }
  let best = user.moves[0]
  let bestScore = -Infinity
  for (const move of user.moves) {
    const score = scoreMove(context, move) * (0.9 + rng() * 0.2)
    if (score > bestScore) {
      bestScore = score
      best = move
    }
  }
  return best
}
