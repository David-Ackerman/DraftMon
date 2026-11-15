import type { TypeChart } from '../typeChart'
import { calcDamage, effectiveStat, stageMult } from './damage'
import { isDamaging, statTarget } from './move-rules'
import type { MoveScorer } from './move-scorers'
import type { BattleMon, BoostStat } from './types'

/** Best expected damage per turn `a` can deal to `d` (optionally one damage class only). */
function bestDamage(
  chart: TypeChart,
  a: BattleMon,
  d: BattleMon,
  cls?: 'physical' | 'special',
): number {
  let best = 0
  for (const m of a.moves) {
    if (!isDamaging(m) || (cls && m.damage_class.name !== cls)) continue
    best = Math.max(
      best,
      calcDamage(chart, a, d, m, { roll: 0.925 }).damage *
        ((m.accuracy ?? 100) / 100),
    )
  }
  return best
}

/**
 * Value of a stat-changing status move, in the same unit as attack scores
 * (expected damage): extra damage dealt or damage prevented over ~2 turns.
 */
export const statChangeScorer: MoveScorer = (
  { chart, user, target, userFaster },
  move,
) => {
  if (!move.stat_changes.length) return null
  const onUser = statTarget(move) === 'user'
  const myBest = bestDamage(chart, user, target)
  const theirBest = bestDamage(chart, target, user)
  // setting up is only worth it if we survive a couple of hits and the foe is not about to fall
  const safe = theirBest < user.hp * 0.45 && myBest < target.hp * 0.6
  let value = 0
  for (const sc of move.stat_changes) {
    const stat = sc.stat.name as BoostStat
    const who = onUser ? user : target
    const before = who.stages[stat]
    const after = Math.max(-6, Math.min(6, before + sc.change))
    const ratio = stageMult(after) / stageMult(before)
    if (onUser && sc.change > 0) {
      if (!safe || before >= 2) continue
      if (stat === 'attack')
        value += bestDamage(chart, user, target, 'physical') * (ratio - 1) * 2
      else if (stat === 'special-attack')
        value += bestDamage(chart, user, target, 'special') * (ratio - 1) * 2
      else if (stat === 'defense')
        value +=
          bestDamage(chart, target, user, 'physical') * (1 - 1 / ratio) * 2
      else if (stat === 'special-defense')
        value +=
          bestDamage(chart, target, user, 'special') * (1 - 1 / ratio) * 2
      else if (
        stat === 'speed' &&
        !userFaster &&
        effectiveStat(user, 'speed') * ratio > effectiveStat(target, 'speed')
      )
        value += myBest
    } else if (!onUser && sc.change < 0) {
      if (before <= -4) continue
      if (stat === 'attack')
        value += bestDamage(chart, target, user, 'physical') * (1 - ratio) * 2
      else if (stat === 'special-attack')
        value += bestDamage(chart, target, user, 'special') * (1 - ratio) * 2
      else if (stat === 'defense')
        value +=
          bestDamage(chart, user, target, 'physical') * (1 / ratio - 1) * 2
      else if (stat === 'special-defense')
        value +=
          bestDamage(chart, user, target, 'special') * (1 / ratio - 1) * 2
      else if (
        stat === 'speed' &&
        !userFaster &&
        effectiveStat(target, 'speed') * ratio < effectiveStat(user, 'speed')
      )
        value += myBest * 0.8
    }
  }
  return value * ((move.accuracy ?? 100) / 100)
}
