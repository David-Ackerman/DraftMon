import type { LeagueMatch, Roll } from '@draftmon/engine'
import type { MatchSummary } from '@draftmon/engine'

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
