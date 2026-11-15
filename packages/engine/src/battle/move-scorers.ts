import type { ApiMove } from '@draftmon/content'
import { effectiveness } from '../typeChart'
import type { TypeChart } from '../typeChart'
import { calcDamage, effectiveStat } from './damage'
import {
  asAilment,
  canReceiveStatus,
  isDamaging,
  statTarget,
} from './move-rules'
import { statChangeScorer } from './stat-scorer'
import type { BattleMon } from './types'

interface ScoringContext {
  chart: TypeChart
  user: BattleMon
  target: BattleMon
  userFaster: boolean
}
export type MoveScorer = (
  context: ScoringContext,
  move: ApiMove,
) => number | null
const accuracy = (move: ApiMove) => (move.accuracy ?? 100) / 100

const damageScorer: MoveScorer = (
  { chart, user, target, userFaster },
  move,
) => {
  if (!isDamaging(move)) return null
  const { damage, mult } = calcDamage(chart, user, target, move, {
    roll: 0.925,
  })
  if (mult === 0) return 0
  if (damage >= target.hp)
    return 1000 + accuracy(move) * 100 + move.priority * 60
  let score = damage * accuracy(move)
  if (move.priority > 0 && !userFaster) score *= 1.2
  if (move.meta?.drain) score *= 1 + move.meta.drain / 200
  if (
    statTarget(move) === 'user' &&
    move.stat_changes.some(({ change }) => change < 0)
  )
    score *= 0.85
  return score
}

const ailmentScorer: MoveScorer = ({ chart, target, userFaster }, move) => {
  const ailment = asAilment(move.meta?.ailment.name)
  if (!ailment) return null
  if (
    !canReceiveStatus(target, ailment) ||
    effectiveness(chart, move.type.name, target.types) === 0
  )
    return 0
  const weight = {
    sleep: 0.45,
    freeze: 0.45,
    paralysis: userFaster ? 0.2 : 0.35,
    burn:
      effectiveStat(target, 'attack') > effectiveStat(target, 'special-attack')
        ? 0.4
        : 0.2,
    poison: 0.25,
  }[ailment]
  return target.maxHp * weight * accuracy(move) * (target.hp / target.maxHp)
}

const healScorer: MoveScorer = ({ user }, move) => {
  if (!move.meta?.healing) return null
  if (user.hp / user.maxHp >= 0.5) return 0
  return (
    Math.min(user.maxHp - user.hp, (user.maxHp * move.meta.healing) / 100) * 1.1
  )
}

const scorers: readonly MoveScorer[] = [
  damageScorer,
  ailmentScorer,
  healScorer,
  statChangeScorer,
]

export function scoreMove(context: ScoringContext, move: ApiMove) {
  for (const scorer of scorers) {
    const score = scorer(context, move)
    if (score !== null) return score
  }
  return 0
}
