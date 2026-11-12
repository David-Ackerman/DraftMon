/** Draft (region + type rolls) and league bracket logic. Pure functions; pass an Rng. */
import type { GameData, TrainerData } from './data'
import { speciesOf, typesOf } from './data'
import type { Rng } from './rng'
import { pick, shuffle } from './rng'
import type { TeamMember } from './battle'

export const TEAM_SIZE = 6
export const OPTIONS_PER_ROLL = 3
export const REROLLS_PER_RUN = 3
export const PLAYER_LEVEL = 50
export const LEAGUE_MATCHES = 7

export type RerollMode = 'type' | 'region' | 'both'

export interface Roll {
  region: string
  type: string
  /** pokemon names; `matches` of them fit region+type exactly */
  options: string[]
  matches: number
}

/** region -> type -> pokemon names (a dual-type creature counts for both types). */
function buildIndex(data: GameData, taken: Set<string>) {
  const index = new Map<string, Map<string, string[]>>()
  for (const p of data.pokemon) {
    if (taken.has(p.name)) continue
    for (const region of data.regionsBySpecies.get(speciesOf(p)) ?? []) {
      const byType = index.get(region) ?? new Map<string, string[]>()
      for (const t of typesOf(p)) byType.set(t, [...(byType.get(t) ?? []), p.name])
      index.set(region, byType)
    }
  }
  return index
}

export function rollOptions(
  data: GameData,
  rng: Rng,
  taken: string[],
  mode: RerollMode = 'both',
  prev?: Pick<Roll, 'region' | 'type'>,
): Roll {
  const takenSet = new Set(taken)
  const index = buildIndex(data, takenSet)
  const regions = [...index.keys()]
  if (regions.length === 0) throw new Error('No pokemon left to draft')

  let region: string | undefined
  let type: string | undefined
  if (prev && mode === 'type' && index.has(prev.region)) {
    region = prev.region
    const types = [...index.get(region)!.keys()].filter((t) => t !== prev.type)
    type = types.length ? pick(rng, types) : undefined
  } else if (prev && mode === 'region') {
    const withType = regions.filter((r) => r !== prev.region && index.get(r)!.has(prev.type))
    if (withType.length) {
      region = pick(rng, withType)
      type = prev.type
    }
  }
  if (!region || !type) {
    const pool = prev ? regions.filter((r) => r !== prev.region) : regions
    region = pick(rng, pool.length ? pool : regions)
    const types = [...index.get(region)!.keys()].filter((t) => !prev || t !== prev.type)
    type = pick(rng, types.length ? types : [...index.get(region)!.keys()])
  }

  const exact = shuffle(rng, index.get(region)!.get(type) ?? [])
  const options = exact.slice(0, OPTIONS_PER_ROLL)
  const matches = options.length
  const fill = (names: string[]) => {
    for (const n of shuffle(rng, names)) {
      if (options.length >= OPTIONS_PER_ROLL) return
      if (!options.includes(n)) options.push(n)
    }
  }
  fill([...index.get(region)!.values()].flat())
  fill(regions.flatMap((r) => index.get(r)!.get(type!) ?? []))
  fill(data.pokemon.map((p) => p.name).filter((n) => !takenSet.has(n)))
  return { region, type, options, matches }
}

// ------------------------------------------------------------------ league

export interface LeagueMatch {
  trainer: TrainerData
  stage: string
}

const STAGES = ['Group 1', 'Group 2', 'Group 3', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final']

/** 3 tier-1 trainers, 3 tier-2 trainers, then a tier-3 champion; random each run. */
export function createLeague(data: GameData, rng: Rng): LeagueMatch[] {
  const used = new Set<string>()
  const take = (tier: number, count: number) => {
    const pool = shuffle(rng, data.trainers.filter((t) => t.tier === tier && !used.has(t.id)))
    const fallback = shuffle(rng, data.trainers.filter((t) => !used.has(t.id)))
    const out: TrainerData[] = []
    for (const t of [...pool, ...fallback]) {
      if (out.length >= count) break
      if (!used.has(t.id)) {
        used.add(t.id)
        out.push(t)
      }
    }
    return out
  }
  const trainers = [...take(1, 3), ...take(2, 3), ...take(3, 1)]
  return trainers.map((trainer, i) => ({ trainer, stage: STAGES[i] ?? `Match ${i + 1}` }))
}

/** Trainers keep their creatures but shuffle the order every match. */
export function trainerTeamForMatch(trainer: TrainerData, rng: Rng): TeamMember[] {
  return shuffle(rng, trainer.pokemon.map((p) => ({ name: p.name, moves: p.moves })))
}
