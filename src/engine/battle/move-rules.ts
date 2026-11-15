import type { ApiMove } from '../data'
import { AILMENTS } from './types'
import type { Ailment, BattleMon } from './types'

export const isDamaging = (m: ApiMove) => m.damage_class.name !== 'status' && (m.power ?? 0) > 0

export function canAfflict(target: BattleMon, ailment: Ailment): boolean {
  if (target.status || target.hp <= 0) return false
  const t = target.types
  if (ailment === 'burn') return !t.includes('fire')
  if (ailment === 'paralysis') return !t.includes('electric')
  if (ailment === 'poison') return !t.includes('poison') && !t.includes('steel')
  if (ailment === 'freeze') return !t.includes('ice')
  return true
}

export const asAilment = (name: string | undefined): Ailment | null =>
  (AILMENTS as string[]).includes(name ?? '') ? (name as Ailment) : null

/** Stat changes from a move: who receives them (PokeAPI semantics). */
export function statTarget(move: ApiMove): 'user' | 'target' {
  if (move.damage_class.name === 'status') return move.target.name === 'user' ? 'user' : 'target'
  return move.meta?.category.name === 'damage+raise' ? 'user' : 'target'
}
