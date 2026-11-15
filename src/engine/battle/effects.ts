import { displayName } from '../data'
import type { ApiMove } from '../data'
import { randInt } from '../rng'
import type { Ailment, BattleContext, BoostStat, Side } from './types'

const BOOST_STATS: BoostStat[] = ['attack', 'defense', 'special-attack', 'special-defense', 'speed']

export function applyStatus(context: BattleContext, side: Side, ailment: Ailment) {
  const { current, rng, emit, active } = context
  const mon = current(side)
  mon.status = ailment
  if (ailment === 'sleep') mon.sleepTurns = randInt(rng, 1, 3)
  const verb = { burn: 'is burned', poison: 'is poisoned', paralysis: 'is paralyzed', sleep: 'fell asleep', freeze: 'is frozen' }[ailment]
  const pt = { burn: 'sofreu uma queimadura', poison: 'foi envenenado', paralysis: 'ficou paralisado', sleep: 'adormeceu', freeze: 'congelou' }[ailment]
  emit({ kind: 'status', side, slot: active[side], status: ailment, text: `${current(side).name} ${verb}!` }, `${current(side).name} ${pt}!`)
}

export function applyStages(context: BattleContext, side: Side, changes: ApiMove['stat_changes']) {
  const { current, emit, active } = context
  const mon = current(side)
  for (const sc of changes) {
    const stat = sc.stat.name as BoostStat
    if (!BOOST_STATS.includes(stat)) continue
    const before = mon.stages[stat]
    mon.stages[stat] = Math.max(-6, Math.min(6, before + sc.change))
    const diff = mon.stages[stat] - before
    const statLabel = displayName(stat)
    const ptStat = { attack: 'Ataque', defense: 'Defesa', 'special-attack': 'Ataque Especial', 'special-defense': 'Defesa Especial', speed: 'Velocidade' }[stat]
    if (diff === 0) {
      emit({ kind: 'info', side, text: `${current(side).name}'s ${statLabel} won't go any ${sc.change > 0 ? 'higher' : 'lower'}!` }, `${ptStat} de ${current(side).name} chegou ao limite!`)
    } else {
      const how = Math.abs(diff) >= 2 ? (diff > 0 ? 'rose sharply' : 'harshly fell') : diff > 0 ? 'rose' : 'fell'
      emit({ kind: 'stat', side, slot: active[side], stat, change: diff, text: `${current(side).name}'s ${statLabel} ${how}!` }, `${ptStat} de ${current(side).name} ${diff > 0 ? 'aumentou' : 'diminuiu'}${Math.abs(diff) >= 2 ? ' bastante' : ''}!`)
    }
  }
}

export function faintCheck(context: BattleContext, side: Side) {
  const { current, events, emit, active } = context
  const mon = current(side)
  if (mon.hp <= 0 && !events.some((e) => e.kind === 'faint' && e.side === side && e.slot === active[side])) {
    emit({ kind: 'faint', side, slot: active[side], text: `${current(side).name} is defeated!` }, `${current(side).name} desmaiou!`)
  }
}

/** Returns false if the user could not act. */
export function beforeMove(context: BattleContext, side: Side): boolean {
  const { current, rng, emit, active } = context
  const mon = current(side)
  if (mon.status === 'sleep') {
    mon.sleepTurns--
    if (mon.sleepTurns > 0) {
      emit({ kind: 'info', side, text: `${current(side).name} is asleep and can't move` }, `${current(side).name} está dormindo e não pode agir.`)
      return false
    }
    mon.status = null
    emit({ kind: 'status', side, slot: active[side], status: null, text: `${current(side).name} woke up!` }, `${current(side).name} acordou!`)
  }
  if (mon.status === 'freeze') {
    if (rng() < 0.2) {
      mon.status = null
      emit({ kind: 'status', side, slot: active[side], status: null, text: `${current(side).name} thawed out!` }, `${current(side).name} descongelou!`)
    } else {
      emit({ kind: 'info', side, text: `${current(side).name} is frozen and can't move` }, `${current(side).name} está congelado e não pode agir.`)
      return false
    }
  }
  if (mon.status === 'paralysis' && rng() < 0.25) {
    emit({ kind: 'info', side, text: `${current(side).name} is paralyzed and can't move` }, `${current(side).name} está paralisado e não pode agir.`)
    return false
  }
  return true
}

export function applyResidual(context: BattleContext, side: Side) {
  const { current, emit, active } = context
  const mon = current(side)
  if (mon.hp <= 0) return
  if (mon.status === 'burn' || mon.status === 'poison') {
    const dmg = Math.min(mon.hp, Math.max(1, Math.floor(mon.maxHp / (mon.status === 'burn' ? 16 : 8))))
    mon.hp -= dmg
    emit({
      kind: 'damage',
      side,
      slot: active[side],
      hp: mon.hp,
      amount: dmg,
      mult: 1,
      crit: false,
      source: mon.status,
      text: `${current(side).name} took ${dmg} damage from ${mon.status === 'burn' ? 'its burn' : 'poison'}`,
    }, `${current(side).name} sofreu ${dmg} de dano por ${mon.status === 'burn' ? 'queimadura' : 'envenenamento'}.`)
    faintCheck(context, side)
  }
}
