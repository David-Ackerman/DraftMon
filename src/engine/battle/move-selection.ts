import type { ApiMove } from '../data'
import type { Rng } from '../rng'
import { effectiveness } from '../typeChart'
import type { TypeChart } from '../typeChart'
import { calcDamage, effectiveStat, stageMult } from './damage'
import { asAilment, canAfflict, isDamaging, statTarget } from './move-rules'
import type { BattleMon, BoostStat } from './types'

/** Best expected damage per turn `a` can deal to `d` (optionally one damage class only). */
function bestDamage(chart: TypeChart, a: BattleMon, d: BattleMon, cls?: 'physical' | 'special'): number {
  let best = 0
  for (const m of a.moves) {
    if (!isDamaging(m) || (cls && m.damage_class.name !== cls)) continue
    best = Math.max(best, calcDamage(chart, a, d, m, { roll: 0.925 }).damage * ((m.accuracy ?? 100) / 100))
  }
  return best
}

/**
 * Value of a stat-changing status move, in the same unit as attack scores
 * (expected damage): extra damage dealt or damage prevented over ~2 turns.
 */
function statMoveValue(chart: TypeChart, move: ApiMove, user: BattleMon, target: BattleMon, userFaster: boolean): number {
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
      if (stat === 'attack') value += bestDamage(chart, user, target, 'physical') * (ratio - 1) * 2
      else if (stat === 'special-attack') value += bestDamage(chart, user, target, 'special') * (ratio - 1) * 2
      else if (stat === 'defense') value += bestDamage(chart, target, user, 'physical') * (1 - 1 / ratio) * 2
      else if (stat === 'special-defense') value += bestDamage(chart, target, user, 'special') * (1 - 1 / ratio) * 2
      else if (stat === 'speed' && !userFaster && effectiveStat(user, 'speed') * ratio > effectiveStat(target, 'speed'))
        value += myBest
    } else if (!onUser && sc.change < 0) {
      if (before <= -4) continue
      if (stat === 'attack') value += bestDamage(chart, target, user, 'physical') * (1 - ratio) * 2
      else if (stat === 'special-attack') value += bestDamage(chart, target, user, 'special') * (1 - ratio) * 2
      else if (stat === 'defense') value += bestDamage(chart, user, target, 'physical') * (1 / ratio - 1) * 2
      else if (stat === 'special-defense') value += bestDamage(chart, user, target, 'special') * (1 / ratio - 1) * 2
      else if (stat === 'speed' && !userFaster && effectiveStat(target, 'speed') * ratio < effectiveStat(user, 'speed'))
        value += myBest * 0.8
    }
  }
  return value * ((move.accuracy ?? 100) / 100)
}

/** Picks the move with the best expected value against the current target. */
export function chooseMove(chart: TypeChart, user: BattleMon, target: BattleMon, rng: Rng): ApiMove {
  const userFaster = effectiveStat(user, 'speed') >= effectiveStat(target, 'speed')
  let best = user.moves[0]
  let bestScore = -Infinity
  for (const move of user.moves) {
    const acc = (move.accuracy ?? 100) / 100
    let score = 0
    if (isDamaging(move)) {
      const { damage, mult } = calcDamage(chart, user, target, move, { roll: 0.925 })
      if (mult === 0) score = 0
      else if (damage >= target.hp) score = 1000 + acc * 100 + move.priority * 60
      else {
        score = damage * acc
        // priority moves are worth more when we are slower
        if (move.priority > 0 && !userFaster) score *= 1.2
        // drain rewards
        if (move.meta?.drain) score *= 1 + move.meta.drain / 200
        // recoil-free self-debuffing nukes are slightly worse
        if (statTarget(move) === 'user' && move.stat_changes.some((s) => s.change < 0)) score *= 0.85
      }
    } else {
      const ailment = asAilment(move.meta?.ailment.name)
      if (ailment) {
        if (canAfflict(target, ailment) && effectiveness(chart, move.type.name, target.types) > 0) {
          const weight = {
            sleep: 0.45,
            freeze: 0.45,
            paralysis: userFaster ? 0.2 : 0.35,
            burn: effectiveStat(target, 'attack') > effectiveStat(target, 'special-attack') ? 0.4 : 0.2,
            poison: 0.25,
          }[ailment]
          score = target.maxHp * weight * acc * (target.hp / target.maxHp)
        }
      } else if (move.meta?.healing) {
        const missing = user.maxHp - user.hp
        if (user.hp / user.maxHp < 0.5) score = Math.min(missing, (user.maxHp * move.meta.healing) / 100) * 1.1
      } else if (move.stat_changes.length) {
        score = statMoveValue(chart, move, user, target, userFaster)
      }
    }
    score *= 0.9 + rng() * 0.2
    if (score > bestScore) {
      bestScore = score
      best = move
    }
  }
  return best
}
