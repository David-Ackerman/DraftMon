import pokemonJson from '../data/pokemon.json'
import movesJson from '../data/moves.json'
import portugueseMovesJson from '../data/moves-pt-br.json'
import typesJson from '../data/types.json'
import regionsJson from '../data/regions.json'
import trainersJson from '../data/trainers.json'
import type { ApiPokemon, ApiPokedex, ApiMove, ApiType, GameData, MoveTranslations, TrainerData } from './types'

function indexCatalog<T extends { name: string }>(entries: T[], collection: string) {
  if (!Array.isArray(entries)) throw new TypeError(`Invalid ${collection} catalog.`)
  const index = new Map<string, T>()
  for (const entry of entries) {
    if (typeof entry?.name !== 'string' || !entry.name || index.has(entry.name)) {
      throw new TypeError(`Invalid or duplicate entry in the ${collection} catalog.`)
    }
    index.set(entry.name, entry)
  }
  return index
}

export function buildGameData(input: {
  pokemon: ApiPokemon[]
  moves: ApiMove[]
  types: ApiType[]
  regions: ApiPokedex[]
  trainers: TrainerData[]
  moveTranslations?: MoveTranslations
}): GameData {
  const pokemonByName = indexCatalog(input.pokemon, 'Pokémon')
  const moveByName = indexCatalog(input.moves, 'move')
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
    pokemonByName,
    moveByName,
    regionsBySpecies,
  }
}

export const gameData: GameData = buildGameData({
  moveTranslations: portugueseMovesJson,
  pokemon: pokemonJson as ApiPokemon[],
  moves: movesJson as ApiMove[],
  types: typesJson as ApiType[],
  regions: regionsJson as ApiPokedex[],
  trainers: trainersJson as TrainerData[],
})
