import type { Roll, createTournamentEngine } from '@draftmon/engine'
import type { TournamentSettings } from '@draftmon/contracts'

export type Store<T> = { read(): T; write(value: T): void }
export type ResetToken = { hash: string; issued: number; expires: number }
export type Account = {
  id: string
  email?: string
  password: string
  salt?: string
  reset?: ResetToken
}
export type Accounts = Record<string, Account>
export type AccountStore = {
  users: Accounts
  sessions: Record<string, { username: string; expires: number }>
}
export type Participant = {
  id: string
  name: string
  avatar: string
  bot?: boolean
}
export type Match = {
  left: string
  right: string | null
  winner: string | null
}
export type Replay = { seed: string; teams: [string[], string[]] }
export type TournamentMatch = Match & {
  replay?: Replay
  seen?: [string[], string[]]
  forfeit?: 'single' | 'double'
}
export type Draft = { team: string[]; rerollsLeft: number; roll: Roll | null }
export type RoundType = 'groups' | 'knockout'
export type Play = {
  seed: string
  phase: 'draft' | RoundType | 'complete'
  participants: Participant[]
  drafts: Record<string, Draft>
  pendingGroups: TournamentMatch[][]
  rounds: { type: RoundType; matches: TournamentMatch[] }[]
  orders: Record<string, string[]>
  champion: string | null
  draftForfeits?: string[]
  roundMs: number
  deadlineAt?: number | null
}
export type Room = {
  code: string
  name: string
  kind: 'room' | 'tournament'
  hostKey: string
  members: Record<string, Participant>
  rounds: Match[][]
  champion: string | null
  settings?: TournamentSettings
  play?: Play
  revision?: number
}
export type Progress = {
  counts: Record<string, number>
  battles: Record<string, true>
}
export type TournamentEngine = ReturnType<typeof createTournamentEngine>
