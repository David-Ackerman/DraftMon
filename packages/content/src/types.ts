export interface NamedRef {
  name: string
  url?: string
}

export interface ApiPokemon {
  id: number
  name: string
  species?: NamedRef & { is_legendary?: boolean; is_mythical?: boolean; descriptions?: Partial<Record<'en' | 'pt-BR', string>> }
  types: { slot: number; type: NamedRef }[]
  stats: { base_stat: number; effort?: number; stat: NamedRef }[]
  abilities?: { ability: NamedRef | null; is_hidden: boolean; slot: number }[]
  moves: { move: NamedRef }[]
  sprites: {
    front_default: string | null
    other?: { 'official-artwork'?: { front_default: string | null } } & Record<string, unknown>
  } & Record<string, unknown>
  cries?: { latest: string | null; legacy?: string | null }
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
  pokemon_entries: { entry_number: number; pokemon_species: NamedRef }[]
}

export interface TrainerData {
  id: string
  name: string
  title: string
  tier: number
  sprite: string
  pokemon: { name: string; moves?: string[] }[]
}

export type StatName = 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'

export type ContentLanguage = 'en' | 'pt-BR'
export type MoveTranslations = Partial<Record<string, { name: string; effect: string }>>

export interface GameData {
  pokemon: ApiPokemon[]
  moves: ApiMove[]
  types: ApiType[]
  regions: ApiPokedex[]
  trainers: TrainerData[]
  pokemonByName: Map<string, ApiPokemon>
  moveByName: Map<string, ApiMove>
  moveTranslations?: MoveTranslations
  /** species name -> region names */
  regionsBySpecies: Map<string, string[]>
}
