import type { BattleResult } from '@draftmon/engine'
import type { Roll } from '@draftmon/engine'

export interface TournamentMember {
  id: string
  name: string
  avatar: string
  bot?: boolean
}
interface TournamentMatch {
  left: string
  right: string | null
  winner: string | null
  watch: boolean
  forfeit?: 'single' | 'double'
}
export interface TournamentState {
  phase: 'draft' | 'groups' | 'knockout' | 'complete'
  participants: (TournamentMember & {
    ready: boolean
    wins: number
    draftForfeit: boolean
    /** Empty for other trainers while the draft is running. */
    team?: string[]
  })[]
  rounds: { type: 'groups' | 'knockout'; matches: TournamentMatch[] }[]
  champion: string | null
  self: { team: string[]; roll: Roll | null; rerollsLeft: number }
  ready: boolean
  deadlineAt?: number | null
}
export interface Replay {
  left: TournamentMember
  right: TournamentMember
  level: number
  result: BattleResult
}
