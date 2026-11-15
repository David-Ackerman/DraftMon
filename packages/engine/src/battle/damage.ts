import type { ApiMove } from '@draftmon/content'
import { effectiveness } from '../typeChart'
import type { TypeChart } from '../typeChart'
import type { BattleMon, BoostStat } from './types'

export const stageMult = (s: number) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s))

export function effectiveStat(
  mon: BattleMon,
  stat: BoostStat,
  ignore?: 'positive' | 'negative',
): number {
  let stage = mon.stages[stat]
  if (ignore === 'positive' && stage > 0) stage = 0
  if (ignore === 'negative' && stage < 0) stage = 0
  let v = mon.stats[stat] * stageMult(stage)
  if (stat === 'speed' && mon.status === 'paralysis') v *= 0.5
  return v
}

export interface DamageOptions {
  crit?: boolean
  roll?: number // 0.85..1
}

export function calcDamage(
  chart: TypeChart,
  user: BattleMon,
  target: BattleMon,
  move: ApiMove,
  opts: DamageOptions = {},
) {
  const physical = move.damage_class.name === 'physical'
  const crit = opts.crit ?? false
  const atk = effectiveStat(
    user,
    physical ? 'attack' : 'special-attack',
    crit ? 'negative' : undefined,
  )
  const def = effectiveStat(
    target,
    physical ? 'defense' : 'special-defense',
    crit ? 'positive' : undefined,
  )
  const struggle = move.name === 'struggle'
  const mult = struggle ? 1 : effectiveness(chart, move.type.name, target.types)
  if (mult === 0) return { damage: 0, mult }
  let dmg =
    Math.floor(
      Math.floor(
        (Math.floor((2 * user.level) / 5 + 2) * (move.power ?? 0) * atk) / def,
      ) / 50,
    ) + 2
  if (crit) dmg *= 1.5
  dmg *= opts.roll ?? 1
  if (!struggle && user.types.includes(move.type.name)) dmg *= 1.5
  dmg *= mult
  if (physical && user.status === 'burn') dmg *= 0.5
  return { damage: Math.max(1, Math.floor(dmg)), mult }
}
