import type { ApiMove } from '@draftmon/content'
import { AILMENTS } from './types'
import type { Ailment, BattleMon } from './types'

export const isDamaging = (m: ApiMove) =>
  m.damage_class.name !== 'status' && (m.power ?? 0) > 0

const immuneTypes: Record<Ailment, string[]> = {
  burn: ['fire'],
  paralysis: ['electric'],
  poison: ['poison', 'steel'],
  freeze: ['ice'],
  sleep: [],
}

export function isImmuneToAilment(
  target: BattleMon,
  ailment: Ailment,
): boolean {
  return immuneTypes[ailment].some((type) => target.types.includes(type))
}

export function canReceiveStatus(target: BattleMon, ailment: Ailment): boolean {
  return target.hp > 0 && !target.status && !isImmuneToAilment(target, ailment)
}

export const asAilment = (name: string | undefined): Ailment | null =>
  (AILMENTS as string[]).includes(name ?? '') ? (name as Ailment) : null

/** Stat changes from a move: who receives them (PokeAPI semantics). */
export function statTarget(move: ApiMove): 'user' | 'target' {
  if (move.damage_class.name === 'status')
    return move.target.name === 'user' ? 'user' : 'target'
  return move.meta?.category.name === 'damage+raise' ? 'user' : 'target'
}
