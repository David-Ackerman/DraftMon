import { moveLabel } from '../data'
import type { ApiMove } from '../data'
import { effectiveness, effectivenessLabel } from '../typeChart'
import { calcDamage } from './damage'
import { applyStages, applyStatus, faintCheck } from './effects'
import { asAilment, canAfflict, isDamaging, statTarget } from './move-rules'
import type { BattleContext, Side } from './types'

const CRIT_CHANCE = [1 / 24, 1 / 8, 1 / 2, 1]

export function performMove(context: BattleContext, side: Side, move: ApiMove) {
  const { current, chart, rng, emit, active } = context
  const foe = (1 - side) as Side
  const user = current(side)
  const target = current(foe)
  emit({ kind: 'move', side, slot: active[side], move: move.name, moveType: move.type.name, attacking: isDamaging(move), text: `${current(side).name} used ${moveLabel(move.name)}` }, `${current(side).name} usou ${moveLabel(move.name, 'pt-BR')}!`)

  if (move.accuracy !== null && rng() * 100 >= move.accuracy) {
    emit({ kind: 'miss', side, text: `${current(side).name} missed!` }, `${current(side).name} errou o golpe!`)
    return
  }
  const ailment = asAilment(move.meta?.ailment.name)

  if (!isDamaging(move)) {
    if (move.meta?.healing) {
      if (user.hp >= user.maxHp) {
        emit({ kind: 'info', side, text: `${current(side).name}'s HP is already full` }, `${current(side).name} já está com os PS cheios.`)
      } else {
        const amount = Math.min(user.maxHp - user.hp, Math.floor((user.maxHp * move.meta.healing) / 100))
        user.hp += amount
        emit({ kind: 'heal', side, slot: active[side], hp: user.hp, text: `${current(side).name} recovered HP` }, `${current(side).name} recuperou PS.`)
      }
    }
    if (ailment) {
      if (effectiveness(chart, move.type.name, target.types) === 0) {
        emit({ kind: 'info', side: foe, text: `It doesn't affect ${current(foe).name}` }, `O golpe não afeta ${current(foe).name}.`)
      } else if (!canAfflict(target, ailment)) emit({ kind: 'info', side, text: 'But it failed!' }, 'O golpe falhou!')
      else applyStatus(context, foe, ailment)
    }
    if (move.stat_changes.length) applyStages(context, statTarget(move) === 'user' ? side : foe, move.stat_changes)
    return
  }

  const critStage = Math.min(3, move.meta?.crit_rate ?? 0)
  const crit = rng() < CRIT_CHANCE[critStage]
  const { damage, mult } = calcDamage(chart, user, target, move, { crit, roll: 0.85 + rng() * 0.15 })
  if (mult === 0) {
    emit({ kind: 'info', side: foe, text: `It doesn't affect ${current(foe).name}` }, `O golpe não afeta ${current(foe).name}.`)
    return
  }
  const dealt = Math.min(target.hp, damage)
  target.hp -= dealt
  const notes = [crit ? 'Critical hit!' : '', effectivenessLabel(mult) ?? ''].filter(Boolean).join(' ')
  const ptNotes = [crit ? 'Acerto crítico!' : '', mult > 1 ? 'Foi superefetivo!' : mult < 1 ? 'Foi pouco efetivo.' : ''].filter(Boolean)
  emit({
    kind: 'damage',
    side: foe,
    slot: active[foe],
    hp: target.hp,
    amount: dealt,
    mult,
    crit,
    text: `${notes ? notes + ' ' : ''}${current(foe).name} took ${dealt} damage`,
  }, [...ptNotes, `${current(foe).name} sofreu ${dealt} de dano.`].join(' '))

  if (move.meta?.drain && dealt > 0) {
    const amount = Math.min(user.maxHp - user.hp, Math.max(1, Math.floor((dealt * move.meta.drain) / 100)))
    if (amount > 0) {
      user.hp += amount
      emit({ kind: 'heal', side, slot: active[side], hp: user.hp, text: `${current(side).name} drained ${amount} HP` }, `${current(side).name} drenou ${amount} PS.`)
    }
  }
  if (target.hp > 0 && ailment && move.meta && rng() * 100 < move.meta.ailment_chance && canAfflict(target, ailment)) {
    applyStatus(context, foe, ailment)
  }
  if (move.stat_changes.length) {
    const who = statTarget(move) === 'user' ? side : foe
    const chance = move.meta?.stat_chance || 100
    if (current(who).hp > 0 && rng() * 100 < chance) applyStages(context, who, move.stat_changes)
  }
  faintCheck(context, foe)
}
