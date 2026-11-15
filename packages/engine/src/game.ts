/** Draft (region + type rolls) and league bracket logic. Pure functions; pass an Rng. */
import type { GameData, TrainerData } from '@draftmon/content'
import { rarityOf, speciesOf, typesOf } from './pokemon'
import type { Rng } from './rng'
import { pick, shuffle } from './rng'
import type { TeamMember } from './battle'

export const TEAM_SIZE = 6
export const OPTIONS_PER_ROLL = 10
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

type DraftIndex = Map<string, Map<string, string[]>>
const draftIndexes = new WeakMap<GameData, DraftIndex>()

/** The catalog is fixed for the lifetime of a GameData instance. */
function draftIndex(data: GameData) {
  const cached = draftIndexes.get(data)
  if (cached) return cached
  const index = new Map<string, Map<string, string[]>>()
  for (const p of data.pokemon) {
    for (const region of data.regionsBySpecies.get(speciesOf(p)) ?? []) {
      const byType = index.get(region) ?? new Map<string, string[]>()
      for (const t of typesOf(p)) {
        const candidates = byType.get(t)
        if (candidates) candidates.push(p.name)
        else byType.set(t, [p.name])
      }
      index.set(region, byType)
    }
  }
  draftIndexes.set(data, index)
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
  const index = draftIndex(data)
  const eligibleTypes = new Map(
    [...index]
      .map(
        ([region, byType]) =>
          [
            region,
            [...byType]
              .filter(([, names]) => names.some((name) => !takenSet.has(name)))
              .map(([type]) => type),
          ] as const,
      )
      .filter(([, types]) => types.length > 0),
  )
  const regions = [...eligibleTypes.keys()]
  if (regions.length === 0) throw new Error('No pokemon left to draft')

  let region: string | undefined
  let type: string | undefined
  if (prev && mode === 'type' && eligibleTypes.has(prev.region)) {
    region = prev.region
    const types = eligibleTypes.get(region)!.filter((t) => t !== prev.type)
    type = types.length ? pick(rng, types) : undefined
  } else if (prev && mode === 'region') {
    const withType = regions.filter(
      (r) => r !== prev.region && eligibleTypes.get(r)!.includes(prev.type),
    )
    if (withType.length) {
      region = pick(rng, withType)
      type = prev.type
    }
  }
  if (!region || !type) {
    const pool = prev ? regions.filter((r) => r !== prev.region) : regions
    region = pick(rng, pool.length ? pool : regions)
    const allowed = eligibleTypes.get(region)!
    const types = allowed.filter((t) => !prev || t !== prev.type)
    type = pick(rng, types.length ? types : allowed)
  }

  const options: string[] = []
  let hasRare = false
  const fill = (names: string[]) => {
    for (const n of shuffle(rng, [...new Set(names)])) {
      if (options.length >= OPTIONS_PER_ROLL) return
      if (options.includes(n)) continue
      const rare = rarityOf(data.pokemonByName.get(n)!) !== null
      if (rare && hasRare) continue
      options.push(n)
      hasRare ||= rare
    }
  }
  fill(
    (index.get(region)!.get(type) ?? []).filter((name) => !takenSet.has(name)),
  )
  const matches = options.length
  if (matches < OPTIONS_PER_ROLL) {
    const wildcards = data.pokemon.filter(
      (p) =>
        !takenSet.has(p.name) &&
        !rarityOf(p) &&
        p.types.some(({ type }) => type.name === 'normal'),
    )
    fill(
      wildcards
        .filter((p) =>
          data.regionsBySpecies.get(speciesOf(p))?.includes(region),
        )
        .map((p) => p.name),
    )
    fill(wildcards.map((p) => p.name))
  }
  return { region, type, options, matches }
}

// ------------------------------------------------------------------ league

export interface LeagueMatch {
  trainer: TrainerData
  stage: string
  level: number
}

const STAGES = [
  'Group 1',
  'Group 2',
  'Group 3',
  'Round of 16',
  'Quarterfinal',
  'Semifinal',
  'Final',
]
/**
 * Opponent level per stage. Tier-2 rosters are much stronger than tier-1, so
 * group opponents get higher levels to keep losses spread across the run
 * (tuned by simulation: ~7-11% of runs go 7-0).
 */
export const STAGE_LEVELS = [50, 51, 52, 47, 48, 49, 51]

/** 3 tier-1 trainers, 3 tier-2 trainers, then a tier-3 champion; random each run. */
export function createLeague(data: GameData, rng: Rng): LeagueMatch[] {
  const used = new Set<string>()
  const take = (tier: number, count: number) => {
    const pool = shuffle(
      rng,
      data.trainers.filter((t) => t.tier === tier && !used.has(t.id)),
    )
    const fallback = shuffle(
      rng,
      data.trainers.filter((t) => !used.has(t.id)),
    )
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
  return trainers.map((trainer, i) => ({
    trainer,
    stage: STAGES[i] ?? `Match ${i + 1}`,
    level: STAGE_LEVELS[i] ?? STAGE_LEVELS[STAGE_LEVELS.length - 1],
  }))
}

/** Trainers keep their creatures but shuffle the order every match. */
export function trainerTeamForMatch(
  trainer: TrainerData,
  rng: Rng,
): TeamMember[] {
  return shuffle(
    rng,
    trainer.pokemon.map((p) => ({ name: p.name, moves: p.moves })),
  )
}
