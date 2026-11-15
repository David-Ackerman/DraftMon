import type { ApiMove } from '../data'
import { effectiveStat } from './damage'
import { applyResidual, beforeMove } from './effects'
import { chooseMove } from './move-selection'
import { performMove } from './perform-move'
import { createMon } from './team'
import type { BattleContext, BattleEvent, BattleMon, BattleResult, Side, SimOptions, TeamMember } from './types'

export function simulateBattle(teamA: TeamMember[], teamB: TeamMember[], opts: SimOptions): BattleResult {
  const { data, chart, rng } = opts
  const names = opts.names ?? ['You', 'Opponent']
  const teams: [BattleMon[], BattleMon[]] = [
    teamA.map((m) => createMon(data, m, opts.levels[0])),
    teamB.map((m) => createMon(data, m, opts.levels[1])),
  ]
  const active: [number, number] = [0, 0]
  const events: BattleEvent[] = []
  const monName = (side: Side) => teams[side][active[side]].name
  const current = (side: Side) => teams[side][active[side]]
  const emit = (e: BattleEvent, pt: string) => events.push({ ...e, pt })

  const context: BattleContext = { chart, rng, active, events, current, emit }

  for (const side of [0, 1] as Side[]) {
    emit({ kind: 'switch', side, slot: 0, text: `${names[side]} chose ${teams[side][0].name}` }, `${names[side]} escolheu ${monName(side)}!`)
  }

  const alive = (side: Side) => teams[side].some((m) => m.hp > 0)
  const maxTurns = opts.maxTurns ?? 200
  let turn = 0
  let winner: Side | null = null

  while (winner === null) {
    turn++
    const choice: [ApiMove, ApiMove] = [chooseMove(chart, current(0), current(1), rng), chooseMove(chart, current(1), current(0), rng)]
    const priority = choice[0].priority - choice[1].priority
    const speed = effectiveStat(current(0), 'speed') - effectiveStat(current(1), 'speed')
    const first: Side = (priority || speed || (rng() < 0.5 ? 1 : -1)) > 0 ? 0 : 1
    const order: Side[] = [first, first === 0 ? 1 : 0]
    const reason = priority ? 'move priority' : speed ? 'higher Speed' : 'Speed tie'
    const orderText = `${names[first]}'s ${monName(first)} goes first (${reason})`
    const ptReason = priority ? 'prioridade do golpe' : speed ? 'maior Velocidade' : 'empate em Velocidade'
    const ptOrder = `${monName(first)} de ${names[first]} age primeiro (${ptReason})`
    emit({ kind: 'turn', turn, orderText, ptOrder, text: `Turn ${turn} · ${orderText}` }, `Turno ${turn} · ${ptOrder}`)
    for (const side of order) {
      if (current(side).hp <= 0 || current((1 - side) as Side).hp <= 0) continue
      if (beforeMove(context, side)) performMove(context, side, choice[side])
    }
    for (const side of order) applyResidual(context, side)

    for (const side of [0, 1] as Side[]) {
      if (current(side).hp > 0) continue
      const next = teams[side].findIndex((m) => m.hp > 0)
      if (next === -1) continue
      active[side] = next
      emit({ kind: 'switch', side, slot: next, text: `${names[side]} sent out ${teams[side][next].name}` }, `${names[side]} enviou ${monName(side)}!`)
    }

    if (!alive(0) || !alive(1)) winner = alive(0) ? 0 : 1
    else if (turn >= maxTurns) {
      const frac = (side: Side) => teams[side].reduce((s, m) => s + m.hp / m.maxHp, 0)
      winner = frac(0) > frac(1) ? 0 : 1
      emit({ kind: 'info', text: 'Turn limit reached. The team with more HP left wins.' }, 'Limite de turnos atingido. A equipe com mais PS restantes vence.')
    }
  }
  emit({ kind: 'end', winner, text: `${names[winner]} defeated ${names[1 - winner]}!` }, `${names[winner]} derrotou ${names[1 - winner]}!`)
  return { winner, turns: turn, events, teams }
}
