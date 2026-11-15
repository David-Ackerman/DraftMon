import type { ApiMove, ApiPokemon, GameData, StatName } from '../data'
import type { Rng } from '../rng'
import type { TypeChart } from '../typeChart'

export type Ailment = 'burn' | 'poison' | 'paralysis' | 'sleep' | 'freeze'
export const AILMENTS: Ailment[] = ['burn', 'poison', 'paralysis', 'sleep', 'freeze']
export type BoostStat = Exclude<StatName, 'hp'>

export interface TeamMember {
  name: string
  moves?: string[]
}

export interface BattleMon {
  name: string
  species: ApiPokemon
  types: string[]
  level: number
  stats: Record<StatName, number>
  maxHp: number
  hp: number
  status: Ailment | null
  sleepTurns: number
  stages: Record<BoostStat, number>
  moves: ApiMove[]
}

export type Side = 0 | 1

export type BattleEvent = { pt?: string; ptOrder?: string } & (
  | { kind: 'turn'; turn: number; orderText: string; text: string }
  | { kind: 'switch'; side: Side; slot: number; text: string }
  | { kind: 'move'; side: Side; slot: number; move: string; moveType: string; attacking?: boolean; text: string }
  | { kind: 'miss'; side: Side; text: string }
  | { kind: 'damage'; side: Side; slot: number; hp: number; amount: number; mult: number; crit: boolean; source?: 'burn' | 'poison'; text: string }
  | { kind: 'heal'; side: Side; slot: number; hp: number; text: string }
  | { kind: 'status'; side: Side; slot: number; status: Ailment | null; text: string }
  | { kind: 'stat'; side: Side; slot: number; stat: string; change: number; text: string }
  | { kind: 'faint'; side: Side; slot: number; text: string }
  | { kind: 'info'; side?: Side; text: string }
  | { kind: 'end'; winner: Side; text: string }
)

export interface BattleResult {
  winner: Side
  turns: number
  events: BattleEvent[]
  teams: [BattleMon[], BattleMon[]]
}

export interface SimOptions {
  data: GameData
  chart: TypeChart
  rng: Rng
  levels: [number, number]
  names?: [string, string]
  maxTurns?: number
}

export interface BattleContext {
  chart: TypeChart
  rng: Rng
  active: [number, number]
  events: BattleEvent[]
  current: (side: Side) => BattleMon
  emit: (event: BattleEvent, pt: string) => void
}
