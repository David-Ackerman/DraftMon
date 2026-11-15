import type { BattleResult, Side } from './battle'
import type { ApiPokemon, GameData } from './data'
import { speciesOf } from './data'

/** Alternate forms share one Pokédex entry, and each species counts once per battle. */
export function battleSpecies(result: BattleResult, side: Side): string[] {
  const species = new Set<string>()
  for (const event of result.events) {
    if (event.kind === 'switch' && event.side === side) {
      species.add(speciesOf(result.teams[side][event.slot].species))
    }
  }
  return [...species]
}

export function regionalPokedex(data: GameData) {
  const representatives = new Map<string, ApiPokemon>()
  for (const pokemon of data.pokemon) {
    const species = speciesOf(pokemon)
    const current = representatives.get(species)
    if (!current || pokemon.id < current.id) representatives.set(species, pokemon)
  }

  const seen = new Set<string>()
  // Catalog regions are ordered by the release of their debut games.
  return data.regions.map((region) => ({
    region,
    pokemon: region.pokemon_entries.flatMap(({ pokemon_species }) => {
      const key = pokemon_species.name
      const pokemon = representatives.get(key)
      if (!pokemon || seen.has(key)) return []
      seen.add(key)
      return [{ key, pokemon }]
    }),
  }))
}
