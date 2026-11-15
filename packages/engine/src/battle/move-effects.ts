import type { ApiMove } from '@draftmon/content'
import { effectiveness, effectivenessLabel } from '../typeChart'
import { calcDamage } from './damage'
import { applyStages, applyStatus, faintEvents } from './effects'
import {
  asAilment,
  canReceiveStatus,
  isDamaging,
  statTarget,
} from './move-rules'
import type { BattleContext, BattleEvent, Side } from './types'

const critChance = [1 / 24, 1 / 8, 1 / 2, 1]
type MoveContext = BattleContext & { side: Side; foe: Side; dealt: number }
type MoveEffect = (context: MoveContext, move: ApiMove) => BattleEvent[]

function unaffected(context: MoveContext): BattleEvent {
  const name = context.current(context.foe).name
  return {
    kind: 'info',
    side: context.foe,
    text: `It doesn't affect ${name}`,
    pt: `O golpe não afeta ${name}.`,
  }
}

const heal: MoveEffect = ({ side, active, current }, move) => {
  const user = current(side)
  const percent = move.meta?.healing ?? 0
  if (!percent) return []
  if (user.hp >= user.maxHp)
    return [
      {
        kind: 'info',
        side,
        text: `${user.name}'s HP is already full`,
        pt: `${user.name} já está com os PS cheios.`,
      },
    ]
  user.hp += Math.min(
    user.maxHp - user.hp,
    Math.floor((user.maxHp * percent) / 100),
  )
  return [
    {
      kind: 'heal',
      side,
      slot: active[side],
      hp: user.hp,
      text: `${user.name} recovered HP`,
      pt: `${user.name} recuperou PS.`,
    },
  ]
}

const ailment: MoveEffect = (context, move) => {
  const status = asAilment(move.meta?.ailment.name)
  if (!status) return []
  const target = context.current(context.foe)
  if (effectiveness(context.chart, move.type.name, target.types) === 0)
    return [unaffected(context)]
  if (!canReceiveStatus(target, status))
    return [
      {
        kind: 'info',
        side: context.side,
        text: 'But it failed!',
        pt: 'O golpe falhou!',
      },
    ]
  return applyStatus(context, context.foe, status)
}

const secondaryAilment: MoveEffect = (context, move) => {
  const status = asAilment(move.meta?.ailment.name)
  const target = context.current(context.foe)
  if (
    target.hp <= 0 ||
    !status ||
    !move.meta ||
    context.rng() * 100 >= move.meta.ailment_chance ||
    !canReceiveStatus(target, status)
  )
    return []
  return applyStatus(context, context.foe, status)
}

const stages: MoveEffect = (context, move) =>
  applyStages(
    context,
    statTarget(move) === 'user' ? context.side : context.foe,
    move.stat_changes,
  )

const secondaryStages: MoveEffect = (context, move) => {
  if (!move.stat_changes.length) return []
  const receiver = statTarget(move) === 'user' ? context.side : context.foe
  if (
    context.current(receiver).hp <= 0 ||
    context.rng() * 100 >= (move.meta?.stat_chance || 100)
  )
    return []
  return applyStages(context, receiver, move.stat_changes)
}

const drain: MoveEffect = ({ side, active, current, dealt }, move) => {
  const percent = move.meta?.drain ?? 0
  if (!percent || dealt <= 0) return []
  const user = current(side)
  const amount = Math.min(
    user.maxHp - user.hp,
    Math.max(1, Math.floor((dealt * percent) / 100)),
  )
  if (amount <= 0) return []
  user.hp += amount
  return [
    {
      kind: 'heal',
      side,
      slot: active[side],
      hp: user.hp,
      text: `${user.name} drained ${amount} HP`,
      pt: `${user.name} drenou ${amount} PS.`,
    },
  ]
}

const statusEffects = [heal, ailment, stages]
const damageEffects = [drain, secondaryAilment, secondaryStages]
const compose =
  (effects: readonly MoveEffect[]): MoveEffect =>
  (context, move) =>
    effects.flatMap((effect) => effect(context, move))

function damaging(effects: readonly MoveEffect[]): MoveEffect {
  const secondary = compose(effects)
  return (context, move) => {
    const { current, chart, side, foe, rng, active } = context
    const target = current(foe)
    const crit = rng() < critChance[Math.min(3, move.meta?.crit_rate ?? 0)]
    const { damage, mult } = calcDamage(chart, current(side), target, move, {
      crit,
      roll: 0.85 + rng() * 0.15,
    })
    if (mult === 0) return [unaffected(context)]
    const dealt = Math.min(target.hp, damage)
    target.hp -= dealt
    const notes = [
      crit ? 'Critical hit!' : '',
      effectivenessLabel(mult) ?? '',
      `${target.name} took ${dealt} damage`,
    ].filter(Boolean)
    const ptNotes = [
      crit ? 'Acerto crítico!' : '',
      mult > 1 ? 'Foi superefetivo!' : mult < 1 ? 'Foi pouco efetivo.' : '',
      `${target.name} sofreu ${dealt} de dano.`,
    ].filter(Boolean)
    return [
      {
        kind: 'damage',
        side: foe,
        slot: active[foe],
        hp: target.hp,
        amount: dealt,
        mult,
        crit,
        text: notes.join(' '),
        pt: ptNotes.join(' '),
      },
      ...secondary({ ...context, dealt }, move),
      ...faintEvents(context, foe),
    ]
  }
}

const statusMove = compose(statusEffects)
const damagingMove = damaging(damageEffects)
const damageOnly = damaging([])
const damageWithStages = damaging([secondaryStages])
type Category = {
  attack: boolean
  effect?: 'ailment' | 'healing' | 'stages'
  resolve: MoveEffect
}
const handlers: Readonly<Record<string, Category>> = {
  damage: { attack: true, resolve: damageOnly },
  'damage-ailment': {
    attack: true,
    effect: 'ailment',
    resolve: damaging([secondaryAilment]),
  },
  'damage-heal': {
    attack: true,
    effect: 'healing',
    resolve: damaging([drain]),
  },
  'damage-raise': { attack: true, effect: 'stages', resolve: damageWithStages },
  'damage-lower': { attack: true, effect: 'stages', resolve: damageWithStages },
  ailment: { attack: false, effect: 'ailment', resolve: ailment },
  heal: { attack: false, effect: 'healing', resolve: heal },
  'net-good-stats': { attack: false, effect: 'stages', resolve: stages },
}

export function resolveMoveEffects(
  context: BattleContext,
  side: Side,
  move: ApiMove,
): BattleEvent[] {
  const category = move.meta?.category.name ?? ''
  const attack = isDamaging(move)
  const extraEffects = [
    asAilment(move.meta?.ailment.name) && 'ailment',
    (attack ? move.meta?.drain : move.meta?.healing) && 'healing',
    move.stat_changes.length && 'stages',
  ].filter(Boolean)
  // Incomplete or mixed move metadata still resolves from the move's actual effects.
  const handler = Object.hasOwn(handlers, category)
    ? handlers[category]
    : undefined
  const resolve =
    handler?.attack === attack &&
    extraEffects.length <= 1 &&
    extraEffects[0] === handler.effect
      ? handler.resolve
      : attack
        ? damagingMove
        : statusMove
  return resolve({ ...context, side, foe: side === 0 ? 1 : 0, dealt: 0 }, move)
}
