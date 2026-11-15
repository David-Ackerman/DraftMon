import type { LeagueMatch, Roll } from '../../engine/game'
import type { MatchSummary } from '../../engine/summary'

export interface Run {
  seed: number
  mode: 'random' | 'daily'
  team: string[]
  roll: Roll | null
  rerollsLeft: number
  league: LeagueMatch[]
  matchIndex: number
  results: boolean[]
  summaries: MatchSummary[]
}

