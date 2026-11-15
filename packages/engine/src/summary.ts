import type { BattleResult, Side } from './battle'

export interface MatchSummary {
  trainerId: string
  stage: string
  won: boolean
  turns: number
  /** player's creature name (slug) -> knockouts scored */
  kos: Record<string, number>
  /** player's creatures that were defeated */
  fainted: string[]
  /** player's creatures still standing at the end */
  survivors: number
}

/**
 * Credits each knockout to the creature whose move came last before the faint
 * (residual burn/poison KOs go to whoever applied the last hit).
 */
export function summarizeBattle(
  result: BattleResult,
  trainerId: string,
  stage: string,
): MatchSummary {
  const kos: Record<string, number> = {}
  const fainted: string[] = []
  let lastMove: { side: Side; slot: number } | null = null
  for (const e of result.events) {
    if (e.kind === 'move') lastMove = { side: e.side, slot: e.slot }
    if (e.kind === 'faint') {
      if (e.side === 0) fainted.push(result.teams[0][e.slot].species.name)
      else if (lastMove && lastMove.side === 0) {
        const name = result.teams[0][lastMove.slot].species.name
        kos[name] = (kos[name] ?? 0) + 1
      }
    }
  }
  return {
    trainerId,
    stage,
    won: result.winner === 0,
    turns: result.turns,
    kos,
    fainted,
    survivors: result.teams[0].filter((m) => m.hp > 0).length,
  }
}

export function mvpOf(kos: Record<string, number>): [string, number] | null {
  const best = Object.entries(kos).sort((a, b) => b[1] - a[1])[0]
  return best && best[1] > 0 ? best : null
}
