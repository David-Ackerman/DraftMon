import type { ApiMove } from '@draftmon/content'
import { displayName } from '../pokemon'
import { randInt } from '../rng'
import type {
  Ailment,
  BattleContext,
  BattleEvent,
  BoostStat,
  Side,
} from './types'

const statLabels: Record<BoostStat, string> = {
  attack: 'Ataque',
  defense: 'Defesa',
  'special-attack': 'Ataque Especial',
  'special-defense': 'Defesa Especial',
  speed: 'Velocidade',
}

export function applyStatus(
  context: BattleContext,
  side: Side,
  ailment: Ailment,
): BattleEvent[] {
  const mon = context.current(side)
  mon.status = ailment
  if (ailment === 'sleep') mon.sleepTurns = randInt(context.rng, 1, 3)
  const verb = {
    burn: 'is burned',
    poison: 'is poisoned',
    paralysis: 'is paralyzed',
    sleep: 'fell asleep',
    freeze: 'is frozen',
  }[ailment]
  const pt = {
    burn: 'sofreu uma queimadura',
    poison: 'foi envenenado',
    paralysis: 'ficou paralisado',
    sleep: 'adormeceu',
    freeze: 'congelou',
  }[ailment]
  return [
    {
      kind: 'status',
      side,
      slot: context.active[side],
      status: ailment,
      text: `${mon.name} ${verb}!`,
      pt: `${mon.name} ${pt}!`,
    },
  ]
}

export function applyStages(
  context: BattleContext,
  side: Side,
  changes: ApiMove['stat_changes'],
): BattleEvent[] {
  const mon = context.current(side)
  const events: BattleEvent[] = []
  for (const {
    stat: { name },
    change,
  } of changes) {
    if (!Object.hasOwn(statLabels, name)) continue
    const stat = name as BoostStat
    const before = mon.stages[stat]
    mon.stages[stat] = Math.max(-6, Math.min(6, before + change))
    const diff = mon.stages[stat] - before
    const label = displayName(stat)
    const ptLabel = statLabels[stat]
    if (diff === 0) {
      events.push({
        kind: 'info',
        side,
        text: `${mon.name}'s ${label} won't go any ${change > 0 ? 'higher' : 'lower'}!`,
        pt: `${ptLabel} de ${mon.name} chegou ao limite!`,
      })
      continue
    }
    const how =
      Math.abs(diff) >= 2
        ? diff > 0
          ? 'rose sharply'
          : 'harshly fell'
        : diff > 0
          ? 'rose'
          : 'fell'
    events.push({
      kind: 'stat',
      side,
      slot: context.active[side],
      stat,
      change: diff,
      text: `${mon.name}'s ${label} ${how}!`,
      pt: `${ptLabel} de ${mon.name} ${diff > 0 ? 'aumentou' : 'diminuiu'}${Math.abs(diff) >= 2 ? ' bastante' : ''}!`,
    })
  }
  return events
}

export function faintEvents(context: BattleContext, side: Side): BattleEvent[] {
  const { hp, name } = context.current(side)
  return hp <= 0
    ? [
        {
          kind: 'faint',
          side,
          slot: context.active[side],
          text: `${name} is defeated!`,
          pt: `${name} desmaiou!`,
        },
      ]
    : []
}

export function checkCanAct(
  context: BattleContext,
  side: Side,
): { canAct: boolean; events: BattleEvent[] } {
  const mon = context.current(side)
  const blocked = (text: string, pt: string) => ({
    canAct: false,
    events: [
      {
        kind: 'info',
        side,
        text: `${mon.name} ${text}`,
        pt: `${mon.name} ${pt}`,
      } satisfies BattleEvent,
    ],
  })
  const recovered = (text: string, pt: string) => {
    mon.status = null
    return {
      canAct: true,
      events: [
        {
          kind: 'status',
          side,
          slot: context.active[side],
          status: null,
          text: `${mon.name} ${text}`,
          pt: `${mon.name} ${pt}`,
        } satisfies BattleEvent,
      ],
    }
  }
  switch (mon.status) {
    case 'sleep':
      return --mon.sleepTurns > 0
        ? blocked("is asleep and can't move", 'está dormindo e não pode agir.')
        : recovered('woke up!', 'acordou!')
    case 'freeze':
      return context.rng() < 0.2
        ? recovered('thawed out!', 'descongelou!')
        : blocked("is frozen and can't move", 'está congelado e não pode agir.')
    case 'paralysis':
      if (context.rng() < 0.25)
        return blocked(
          "is paralyzed and can't move",
          'está paralisado e não pode agir.',
        )
  }
  return { canAct: true, events: [] }
}

export function applyEndOfTurnDamage(
  context: BattleContext,
  side: Side,
): BattleEvent[] {
  const mon = context.current(side)
  if (mon.hp <= 0 || (mon.status !== 'burn' && mon.status !== 'poison'))
    return []
  const burned = mon.status === 'burn'
  const damage = Math.min(
    mon.hp,
    Math.max(1, Math.floor(mon.maxHp / (burned ? 16 : 8))),
  )
  mon.hp -= damage
  return [
    {
      kind: 'damage',
      side,
      slot: context.active[side],
      hp: mon.hp,
      amount: damage,
      mult: 1,
      crit: false,
      source: mon.status,
      text: `${mon.name} took ${damage} damage from ${burned ? 'its burn' : 'poison'}`,
      pt: `${mon.name} sofreu ${damage} de dano por ${burned ? 'queimadura' : 'envenenamento'}.`,
    },
    ...faintEvents(context, side),
  ]
}
