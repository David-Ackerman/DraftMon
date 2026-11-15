import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { pokemon, supportedMoves, trainers } from './content.mjs'

const root = new URL('../', import.meta.url)
const api = 'https://pokeapi.co/api/v2/'
const cache = new URL('.pokeapi-cache/', root)
const refresh = process.argv.includes('--refresh')
const run = promisify(execFile)
await mkdir(cache, { recursive: true })

async function pool(values, load) {
  const queue = values.entries()
  const results = []
  await Promise.all(Array.from({ length: Math.min(8, values.length) }, async () => {
    for (const [index, value] of queue) results[index] = await load(value)
  }))
  return results
}

async function retrieve(url, path, binary = false) {
  if (!refresh) {
    try {
      const saved = await readFile(path)
      return binary ? saved : JSON.parse(saved)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20_000) })
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
      const bytes = Buffer.from(await response.arrayBuffer())
      const result = binary ? bytes : JSON.parse(bytes)
      await writeFile(path, bytes)
      return result
    } catch (error) {
      if (attempt === 2) throw new Error(`Could not fetch ${url}`, { cause: error })
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)))
    }
  }
}

function resource(kind, id) {
  return retrieve(`${api}${kind}/${id}/`, new URL(`${kind}-${id}.json`, cache))
}

async function asset(url, path) {
  if (!url) return null
  const file = new URL(`public${path}`, root)
  await mkdir(new URL('.', file), { recursive: true })
  await retrieve(url, file, true)
  return path
}

async function artworkFor(url, id) {
  if (!url) return null
  const path = `/pokemon/${id}.webp`
  const file = new URL(`public${path}`, root)
  await mkdir(new URL('.', file), { recursive: true })
  if (!refresh) {
    try {
      await readFile(file)
      return path
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  const original = new URL(`artwork-${id}.png`, cache)
  await retrieve(url, original, true)
  await run('ffmpeg', [
    '-y', '-v', 'error', '-i', fileURLToPath(original),
    '-vf', 'scale=240:240:force_original_aspect_ratio=decrease',
    '-c:v', 'libwebp', '-quality', '86', fileURLToPath(file),
  ])
  return path
}

const ref = ({ name }) => ({ name })
const english = (entries) => entries.filter(({ language }) => language.name === 'en')
const teams = trainers.map(({ portrait, team, ...trainer }) => ({
  ...trainer,
  sprite: `/trainers/${trainer.id}.png`,
  pokemon: team.split(' ').map((name) => ({ name })),
  portrait,
}))

const roster = [...new Set([...pokemon, ...teams.flatMap((trainer) => trainer.pokemon.map(({ name }) => name))])]
const pokemonResources = await pool(roster, (name) => resource('pokemon', name))
const knownMoves = new Set(pokemonResources.flatMap((entry) => entry.moves.map(({ move }) => move.name)))
const moveResources = await pool(
  [...new Set(supportedMoves)].filter((name) => knownMoves.has(name)),
  (name) => resource('move', name),
)
// The simulator supports single-turn attacks and a subset of status moves.
const unsupportedMoves = new Set(['magnitude', 'rock-blast', 'phantom-force', 'yawn', 'acrobatics', 'sucker-punch', 'payback', 'hex', 'knock-off', 'torch-song', 'take-down', 'double-edge', 'flare-blitz', 'wood-hammer', 'wild-charge', 'brave-bird', 'submission', 'ceaseless-edge'])
const supportedAilments = new Set(['none', 'burn', 'poison', 'paralysis', 'sleep', 'freeze'])
const moves = moveResources.filter((move) => {
  const { name, meta, power, target, damage_class: damageClass, stat_changes: stats } = move
  if (unsupportedMoves.has(name)) return false
  if (damageClass.name === 'status') {
    return (target.name === 'user' && (meta?.healing > 0 || stats.some(({ change }) => change > 0)))
      || supportedAilments.has(meta?.ailment.name) && meta.ailment.name !== 'none'
  }
  return power > 0 && (meta?.drain ?? 0) >= 0 && (meta?.max_hits ?? 1) <= 1
    && supportedAilments.has(meta?.ailment.name ?? 'none')
}).map(({ id, name, accuracy, power, pp, priority, damage_class, type, target, meta, stat_changes, effect_entries, flavor_text_entries }) => ({
  id, name, accuracy, power, pp, priority, damage_class: ref(damage_class), type: ref(type), target: ref(target),
  meta: meta && {
    ailment: ref(meta.ailment), ailment_chance: meta.ailment_chance, category: ref(meta.category),
    crit_rate: meta.crit_rate, drain: meta.drain, flinch_chance: meta.flinch_chance,
    healing: meta.healing, stat_chance: meta.stat_chance,
  },
  stat_changes: stat_changes.map(({ change, stat }) => ({ change, stat: ref(stat) })),
  effect_entries: english(effect_entries).length
    ? english(effect_entries).map(({ language, short_effect }) => ({ language: ref(language), short_effect }))
    : english(flavor_text_entries).slice(-1).map(({ language, flavor_text }) => ({
      language: ref(language), short_effect: flavor_text.replace(/\s+/g, ' '),
    })),
}))
const movesByName = new Map(moves.map((move) => [move.name, move]))
const incomplete = pokemonResources.filter((entry) => {
  const learnset = entry.moves.map(({ move }) => movesByName.get(move.name)).filter(Boolean)
  return learnset.length < 4 || !learnset.some((move) => move.power > 0)
})
if (incomplete.length) throw new Error(`Missing compatible moves for ${incomplete.map(({ name }) => name).join(', ')}`)

const types = (await pool(Array.from({ length: 18 }, (_, index) => index + 1), (id) => resource('type', id)))
  .map(({ name, damage_relations }) => ({
    name,
    damage_relations: Object.fromEntries(Object.entries(damage_relations).map(([key, entries]) => [key, entries.map(ref)])),
  }))

const species = new Set(pokemonResources.map((entry) => entry.species.name))
const speciesData = await pool([...species], (name) => resource('pokemon-species', name))
const speciesByName = new Map(speciesData.map((entry) => [entry.name, entry]))
const portugueseDescriptions = JSON.parse(await readFile(new URL('src/data/pokedex-pt-br.json', root), 'utf8'))
const regionIds = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea']
const regions = await pool(regionIds, async (regionId) => {
  const region = await resource('region', regionId)
  const entries = new Map()
  for (const { name } of region.pokedexes) {
    const dex = await resource('pokedex', name)
    for (const { entry_number, pokemon_species } of dex.pokemon_entries) {
      if (species.has(pokemon_species.name) && !entries.has(pokemon_species.name)) {
        entries.set(pokemon_species.name, { entry_number, pokemon_species: ref(pokemon_species) })
      }
    }
  }
  if (!entries.size) throw new Error(`No drafted species in ${region.name}`)
  return {
    name: region.name,
    names: english(region.names).map(({ name, language }) => ({ name, language: ref(language) })),
    pokemon_entries: [...entries.values()],
  }
})

const pokemonData = await pool(pokemonResources, async (entry) => {
  const { id, name, species, types, stats, abilities, moves, sprites, cries } = entry
  const { is_legendary, is_mythical, flavor_text_entries } = speciesByName.get(species.name)
  const descriptions = {}
  for (const { language, flavor_text } of flavor_text_entries) {
    const locale = language.name === 'pt-br' ? 'pt-BR' : language.name
    if (locale === 'en' || locale === 'pt-BR') {
      const description = flavor_text.replace(/\s+/g, ' ').trim()
      if (description) descriptions[locale] = description
    }
  }
  descriptions['pt-BR'] ??= portugueseDescriptions[species.name]
  const artwork = sprites.other['official-artwork'].front_default ?? sprites.front_default
  const front = await artworkFor(artwork, id)
  const cry = await asset(cries.latest ?? cries.legacy, `/cries/${id}.ogg`)
  if (!front || !cry) throw new Error(`Missing artwork or cry for ${name}`)
  return {
    id, name, species: { name: species.name, is_legendary, is_mythical, descriptions },
    types: types.map(({ slot, type }) => ({ slot, type: ref(type) })),
    stats: stats.map(({ base_stat, stat }) => ({ base_stat, stat: ref(stat) })),
    abilities: abilities.map(({ ability, is_hidden, slot }) => ({ ability: ability && ref(ability), is_hidden, slot })),
    moves: moves.filter(({ move }) => movesByName.has(move.name)).map(({ move }) => ({ move: ref(move) })),
    sprites: { front_default: front },
    cries: { latest: cry },
  }
})

const trainerData = await pool(teams, async ({ portrait, ...trainer }) => {
  await asset(`https://play.pokemonshowdown.com/sprites/trainers/${portrait}.png`, trainer.sprite)
  return trainer
})

for (const [name, data] of Object.entries({ pokemon: pokemonData, moves, types, regions, trainers: trainerData })) {
  await writeFile(new URL(`src/data/${name}.json`, root), `[\n${data.map((entry) => JSON.stringify(entry)).join(',\n')}\n]\n`)
}
console.log(`Imported ${pokemonData.length} Pokémon, ${moves.length} moves, ${regions.length} regions and ${teams.length} trainers.`)
