/**
 * Loads game content. Every file follows the PokeAPI resource shape
 * (https://pokeapi.co/docs/v2), so the files in src/data can be swapped for
 * other PokeAPI-shaped data without touching the engine:
 *   pokemon.json  -> array of /pokemon/{id} resources
 *   moves.json    -> array of /move/{id} resources
 *   types.json    -> array of /type/{id} resources (damage_relations)
 *   regions.json  -> array of /pokedex/{id} resources (pokemon_entries)
 *   trainers.json -> game-specific (PokeAPI has no trainers)
 */
import pokemonJson from '../data/pokemon.json'
import movesJson from '../data/moves.json'
import typesJson from '../data/types.json'
import regionsJson from '../data/regions.json'
import trainersJson from '../data/trainers.json'

export interface NamedRef {
  name: string
  url?: string
}

export interface ApiPokemon {
  id: number
  name: string
  species?: NamedRef
  types: { slot: number; type: NamedRef }[]
  stats: { base_stat: number; effort?: number; stat: NamedRef }[]
  abilities?: { ability: NamedRef | null; is_hidden: boolean; slot: number }[]
  moves: { move: NamedRef }[]
  sprites: {
    front_default: string | null
    other?: { 'official-artwork'?: { front_default: string | null } } & Record<string, unknown>
  } & Record<string, unknown>
}

export interface ApiMove {
  id: number
  name: string
  accuracy: number | null
  power: number | null
  pp: number | null
  priority: number
  damage_class: NamedRef
  type: NamedRef
  target: NamedRef
  meta: {
    ailment: NamedRef
    ailment_chance: number
    category: NamedRef
    crit_rate: number
    drain: number
    flinch_chance: number
    healing: number
    stat_chance: number
  } | null
  stat_changes: { change: number; stat: NamedRef }[]
  effect_entries?: { short_effect: string; language: NamedRef }[]
}

export interface ApiType {
  name: string
  damage_relations: {
    double_damage_to: NamedRef[]
    half_damage_to: NamedRef[]
    no_damage_to: NamedRef[]
  }
}

export interface ApiPokedex {
  name: string
  names?: { name: string; language: NamedRef }[]
  descriptions?: { description: string; language: NamedRef }[]
  pokemon_entries: { entry_number: number; pokemon_species: NamedRef }[]
}

export interface TrainerData {
  id: string
  name: string
  title: string
  tier: number
  level: number
  sprite: string
  pokemon: { name: string; moves?: string[] }[]
}

export type StatName = 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'
export const STAT_NAMES: StatName[] = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
export const STAT_LABELS: Record<StatName, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
}

export interface GameData {
  pokemon: ApiPokemon[]
  moves: ApiMove[]
  types: ApiType[]
  regions: ApiPokedex[]
  trainers: TrainerData[]
  pokemonByName: Map<string, ApiPokemon>
  moveByName: Map<string, ApiMove>
  /** species name -> region names */
  regionsBySpecies: Map<string, string[]>
}

export function buildGameData(input: {
  pokemon: ApiPokemon[]
  moves: ApiMove[]
  types: ApiType[]
  regions: ApiPokedex[]
  trainers: TrainerData[]
}): GameData {
  const regionsBySpecies = new Map<string, string[]>()
  for (const r of input.regions) {
    for (const e of r.pokemon_entries) {
      const list = regionsBySpecies.get(e.pokemon_species.name) ?? []
      list.push(r.name)
      regionsBySpecies.set(e.pokemon_species.name, list)
    }
  }
  return {
    ...input,
    pokemonByName: new Map(input.pokemon.map((p) => [p.name, p])),
    moveByName: new Map(input.moves.map((m) => [m.name, m])),
    regionsBySpecies,
  }
}

export const gameData: GameData = buildGameData({
  pokemon: pokemonJson as ApiPokemon[],
  moves: movesJson as ApiMove[],
  types: typesJson as ApiType[],
  regions: regionsJson as ApiPokedex[],
  trainers: trainersJson as TrainerData[],
})

// ------------------------------------------------------------------ helpers

export const displayName = (slug: string) =>
  slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')

export const regionLabel = (r: ApiPokedex) => r.names?.find((n) => n.language.name === 'en')?.name ?? displayName(r.name)

export const regionDescription = (r: ApiPokedex) =>
  r.descriptions?.find((d) => d.language.name === 'en')?.description ?? ''

export const typesOf = (p: ApiPokemon) => [...p.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name)

export const baseStat = (p: ApiPokemon, stat: StatName) => p.stats.find((s) => s.stat.name === stat)?.base_stat ?? 0

export const baseStatTotal = (p: ApiPokemon) => p.stats.reduce((sum, s) => sum + s.base_stat, 0)

export const spriteOf = (p: ApiPokemon) =>
  p.sprites.other?.['official-artwork']?.front_default ?? p.sprites.front_default ?? ''

export const abilityOf = (p: ApiPokemon) =>
  p.abilities?.find((a) => !a.is_hidden)?.ability?.name ?? p.abilities?.[0]?.ability?.name ?? ''

export const speciesOf = (p: ApiPokemon) => p.species?.name ?? p.name

export const moveEffect = (m: ApiMove) => m.effect_entries?.find((e) => e.language.name === 'en')?.short_effect ?? ''
