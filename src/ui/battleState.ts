import type { BattleResult } from '../engine/battle'
import type { StatName } from '../engine/data'

export type Stages = Partial<Record<StatName, number>>

export interface ViewState {
  active: [number, number]
  hp: [number[], number[]]
  status: [(string | null)[], (string | null)[]]
  stages: [Stages[], Stages[]]
}

/** Rebuilds what the cards should show after `upTo` events. */
export function viewAt(result: BattleResult, upTo: number): ViewState {
  const s: ViewState = {
    active: [0, 0],
    hp: [result.teams[0].map((m) => m.maxHp), result.teams[1].map((m) => m.maxHp)],
    status: [result.teams[0].map(() => null), result.teams[1].map(() => null)],
    stages: [result.teams[0].map(() => ({})), result.teams[1].map(() => ({}))],
  }
  for (let i = 0; i <= upTo && i < result.events.length; i++) {
    const e = result.events[i]
    switch (e.kind) {
      case 'switch':
        s.active[e.side] = e.slot
        break
      case 'damage':
      case 'heal':
        s.hp[e.side][e.slot] = e.hp
        break
      case 'status':
        s.status[e.side][e.slot] = e.status
        break
      case 'stat': {
        const st = s.stages[e.side][e.slot]
        const key = e.stat as StatName
        st[key] = Math.max(-6, Math.min(6, (st[key] ?? 0) + e.change))
        break
      }
      case 'faint':
        s.hp[e.side][e.slot] = 0
        break
    }
  }
  return s
}

