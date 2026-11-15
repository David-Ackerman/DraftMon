import type {
  ApiMove,
  ApiPokedex,
  ApiPokemon,
  ContentLanguage,
  MoveTranslations,
  StatName,
} from '@draftmon/content'

export const STAT_NAMES: StatName[] = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
]
export const STAT_LABELS: Record<StatName, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
}

export const displayName = (slug: string) =>
  slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')

export const regionLabel = (r: ApiPokedex) =>
  r.names?.find((n) => n.language.name === 'en')?.name ?? displayName(r.name)

export const typesOf = (p: ApiPokemon) =>
  [...p.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name)

export const baseStat = (p: ApiPokemon, stat: StatName) =>
  p.stats.find((s) => s.stat.name === stat)?.base_stat ?? 0

export const baseStatTotal = (p: ApiPokemon) =>
  p.stats.reduce((sum, s) => sum + s.base_stat, 0)

export const spriteOf = (p: ApiPokemon) =>
  p.sprites.other?.['official-artwork']?.front_default ??
  p.sprites.front_default ??
  ''

export const abilityOf = (p: ApiPokemon) =>
  p.abilities?.find((a) => !a.is_hidden)?.ability?.name ??
  p.abilities?.[0]?.ability?.name ??
  ''

export const speciesOf = (p: ApiPokemon) => p.species?.name ?? p.name

export const rarityOf = (p: ApiPokemon) =>
  p.species?.is_mythical
    ? 'Mythical'
    : p.species?.is_legendary
      ? 'Legendary'
      : null

export const moveLabel = (
  slug: string,
  language: ContentLanguage = 'en',
  translations?: MoveTranslations,
) =>
  (language === 'pt-BR' ? translations?.[slug]?.name : undefined) ??
  displayName(slug)

export function moveEffect(
  move: ApiMove,
  language: ContentLanguage = 'en',
  translations?: MoveTranslations,
) {
  const translated =
    language === 'pt-BR' ? translations?.[move.name]?.effect : undefined
  const text =
    translated ??
    move.effect_entries?.find((entry) => entry.language.name === 'en')
      ?.short_effect
  return text ? { text, language: translated ? 'pt-BR' : 'en' } : null
}
