import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { gameData } from '@draftmon/content'
import type { ApiPokemon } from '@draftmon/content'
import {
  PLAYER_LEVEL,
  STAT_NAMES,
  abilityOf,
  baseStat,
  baseStatTotal,
  buildTypeChart,
  chooseMoveset,
  defensiveProfile,
  displayName,
  moveLabel,
  rarityOf,
  regionLabel,
  speciesOf,
  spriteOf,
  typesOf,
} from '@draftmon/engine'
import { PublicPage } from '../../PublicPage'
import { publicMetadata, siteUrl } from '../../site'
import { TypeTag } from '../../../components/pokemon/TypeTag'
import { legendaryFrame } from '../../../components/pokemon/legendaryFrame'
import { cn } from '../../../components/ui/cn'
import { Localized } from '../../../components/ui/Localized'

const chart = buildTypeChart(gameData.types)
const totals = gameData.pokemon.map(baseStatTotal).sort((a, b) => a - b)
const speeds = gameData.pokemon
  .map((p) => baseStat(p, 'speed'))
  .sort((a, b) => a - b)
const regionPages = new Set(gameData.regions.map(({ name }) => name))

/** Share of all Pokémon with a lower value, as a whole percentage. */
function percentile(sorted: number[], value: number) {
  let below = 0
  while (below < sorted.length && sorted[below] < value) below++
  return Math.round((below / sorted.length) * 100)
}

const STAT_PT: Record<string, string> = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defesa',
  'special-attack': 'Ataque Especial',
  'special-defense': 'Defesa Especial',
  speed: 'Velocidade',
}
const CLASS_LABEL: Record<string, [string, string]> = {
  physical: ['Physical', 'Físico'],
  special: ['Special', 'Especial'],
  status: ['Status', 'Status'],
}

function roleOf(pokemon: ApiPokemon): [string, string] {
  const stat = (name: Parameters<typeof baseStat>[1]) => baseStat(pokemon, name)
  const attack = Math.max(stat('attack'), stat('special-attack'))
  const bulk = stat('hp') + (stat('defense') + stat('special-defense')) / 2
  const speed = stat('speed')
  const kind =
    stat('attack') >= stat('special-attack')
      ? ['physical', 'físico']
      : ['special', 'especial']
  if (speed >= 95 && attack >= 95)
    return [
      `a fast ${kind[0]} attacker that often strikes first`,
      `um atacante ${kind[1]} rápido que costuma agir primeiro`,
    ]
  if (attack >= 100)
    return [
      `a hard-hitting ${kind[0]} attacker`,
      `um atacante ${kind[1]} de golpes fortes`,
    ]
  if (bulk >= 160)
    return [
      'a bulky Pokémon that can take several hits',
      'um Pokémon resistente que aguenta vários golpes',
    ]
  if (speed >= 90)
    return [
      'a fast Pokémon that usually moves first',
      'um Pokémon rápido que geralmente age primeiro',
    ]
  return [
    'a balanced Pokémon best used for type coverage',
    'um Pokémon equilibrado, melhor usado para cobrir tipos',
  ]
}

function similarTo(pokemon: ApiPokemon) {
  const [main] = typesOf(pokemon)
  const total = baseStatTotal(pokemon)
  return gameData.pokemon
    .filter(
      (other) =>
        other.name !== pokemon.name &&
        speciesOf(other) !== speciesOf(pokemon) &&
        typesOf(other).includes(main),
    )
    .sort(
      (a, b) =>
        Math.abs(baseStatTotal(a) - total) - Math.abs(baseStatTotal(b) - total),
    )
    .slice(0, 4)
}

export function generateStaticParams() {
  return gameData.pokemon.map(({ name }) => ({ name }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>
}): Promise<Metadata> {
  const { name } = await params
  const pokemon = gameData.pokemonByName.get(name)
  if (!pokemon) notFound()
  const title = displayName(name)
  return publicMetadata(
    `${title} in Draftmon`,
    `${title}: types, base stats, type matchups, battle moveset and where to draft it in Draftmon.`,
    '/pokedex/' + name,
    spriteOf(pokemon) || undefined,
  )
}

function Section({
  en,
  pt,
  children,
}: {
  en: string
  pt: string
  children: ReactNode
}) {
  return (
    <section className="grid content-start gap-3 rounded-panel border-3 border-outline bg-panel p-5 shadow-[5px_5px_0_var(--outline)]">
      <h2 className="m-0">
        <Localized en={en} pt={pt} />
      </h2>
      {children}
    </section>
  )
}

function TagRow({
  en,
  pt,
  types,
  note,
}: {
  en: string
  pt: string
  types: string[]
  note?: string
}) {
  if (!types.length) return null
  return (
    <div className="grid gap-1.5">
      <span className="text-[.78rem] font-black tracking-[.06em] text-muted uppercase">
        <Localized en={en} pt={pt} />
        {note && ` · ${note}`}
      </span>
      <span className="flex flex-wrap gap-1.5">
        {types.map((type) => (
          <TypeTag key={type} type={type} />
        ))}
      </span>
    </div>
  )
}

export default async function Page({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const pokemon = gameData.pokemonByName.get(name)
  if (!pokemon) notFound()
  const title = displayName(name)
  const types = typesOf(pokemon)
  const sprite = spriteOf(pokemon)
  const rarity = rarityOf(pokemon)
  const ability = abilityOf(pokemon)
  const description = pokemon.species?.descriptions?.en
  const total = baseStatTotal(pokemon)
  const totalRank = percentile(totals, total)
  const speedRank = percentile(speeds, baseStat(pokemon, 'speed'))
  const [roleEn, rolePt] = roleOf(pokemon)
  const regionNames = gameData.regionsBySpecies.get(speciesOf(pokemon)) ?? []
  const regions = gameData.regions.filter(({ name }) =>
    regionNames.includes(name),
  )
  const wildcard = !rarity && types.includes('normal')
  const { weak, resist, immune } = defensiveProfile(chart, types)
  const quadWeak = weak.filter(([, m]) => m >= 4).map(([t]) => t)
  const doubleWeak = weak.filter(([, m]) => m < 4).map(([t]) => t)
  const quadResist = resist.filter(([, m]) => m <= 0.25).map(([t]) => t)
  const halfResist = resist.filter(([, m]) => m > 0.25).map(([t]) => t)
  const moves = chooseMoveset(pokemon, gameData)
  const similar = similarTo(pokemon)
  const best = [...STAT_NAMES].sort(
    (a, b) => baseStat(pokemon, b) - baseStat(pokemon, a),
  )[0]
  const structured = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${title} in Draftmon`,
    description: `${title}: types, base stats, matchups and battle moveset in Draftmon.`,
    ...(siteUrl && {
      url: new URL('/pokedex/' + name, siteUrl),
      ...(sprite && { image: new URL(sprite, siteUrl) }),
    }),
  }).replace(/</g, '\\u003c')

  return (
    <PublicPage>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structured }}
      />
      <nav className="mb-3 text-[.9rem] font-extrabold [&_a]:text-brand">
        <Link href="/pokedex">Pokédex</Link> / {title}
      </nav>
      <div className="grid gap-5">
        <article className="flex flex-wrap items-center gap-6 rounded-panel border-3 border-outline bg-panel p-6 shadow-[5px_5px_0_var(--outline)]">
          {sprite && (
            <div
              className={cn(
                'grid size-[180px] shrink-0 place-items-center rounded-2xl bg-panel-muted [--foil-surface:var(--card2)]',
                rarity ? legendaryFrame : 'border-3 border-outline',
              )}
            >
              <Image
                src={sprite}
                alt={title}
                width={160}
                height={160}
                unoptimized
                preload
                className="object-contain"
              />
            </div>
          )}
          <div className="grid min-w-0 flex-[1_1_320px] gap-2.5">
            <span className="font-pixel text-[.7rem] text-muted">
              #{String(pokemon.id).padStart(4, '0')}
            </span>
            <h1 className="m-0">{title}</h1>
            <div className="flex flex-wrap gap-1.5">
              {types.map((type) => (
                <TypeTag key={type} type={type} />
              ))}
              {rarity && (
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-outline bg-[#f1e9ff] px-2.5 py-0.5 text-[.72rem] font-black text-[#43357a] uppercase dark:bg-[#2c2550] dark:text-[#e2d7ff]">
                  <Image src="/masterball.svg" width={16} height={16} alt="" />
                  <Localized
                    en={rarity}
                    pt={rarity === 'Mythical' ? 'Mítico' : 'Lendário'}
                  />
                </span>
              )}
            </div>
            <p className="m-0 font-bold">
              <Localized
                en={`In Draftmon, ${title} is ${roleEn}. Its base stat total of ${total} is higher than ${totalRank}% of all Pokémon in the game, and its best stat is ${displayName(best)} (${baseStat(pokemon, best)}).${ability ? ` It battles with the ${displayName(ability)} ability.` : ''}`}
                pt={`No Draftmon, ${title} é ${rolePt}. Seu total de atributos base, ${total}, supera ${totalRank}% de todos os Pokémon do jogo, e seu melhor atributo é ${STAT_PT[best]} (${baseStat(pokemon, best)}).${ability ? ` Ele batalha com a habilidade ${displayName(ability)}.` : ''}`}
              />
            </p>
            {description && (
              <p className="m-0 rounded-xl border-2 border-line bg-panel-muted px-3.5 py-2.5 text-[.92rem]">
                <strong>
                  <Localized en="Pokédex entry: " pt="Entrada da Pokédex: " />
                </strong>
                <Localized
                  en={description}
                  pt={pokemon.species?.descriptions?.['pt-BR'] ?? description}
                />
              </p>
            )}
          </div>
        </article>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-5">
          <Section en="Base stats" pt="Atributos base">
            <dl className="m-0 grid gap-2">
              {STAT_NAMES.map((stat) => {
                const value = baseStat(pokemon, stat)
                return (
                  <div
                    key={stat}
                    className="grid grid-cols-[130px_40px_1fr] items-center gap-2"
                  >
                    <dt className="font-extrabold">
                      <Localized en={displayName(stat)} pt={STAT_PT[stat]} />
                    </dt>
                    <dd className="m-0 text-right font-pixel text-[.7rem]">
                      {value}
                    </dd>
                    <dd className="m-0 h-3 overflow-hidden rounded-full border-2 border-outline bg-panel-muted">
                      <span
                        className="block h-full bg-[#3fbf5f]"
                        style={{
                          width: `${Math.min(100, (value / 200) * 100)}%`,
                        }}
                      />
                    </dd>
                  </div>
                )
              })}
              <div className="grid grid-cols-[130px_40px_1fr] items-center gap-2 border-t-2 border-line pt-2">
                <dt className="font-black">
                  <Localized en="Total" pt="Total" />
                </dt>
                <dd className="m-0 text-right font-pixel text-[.7rem]">
                  {total}
                </dd>
              </div>
            </dl>
            <p className="m-0 text-[.9rem] font-bold text-muted">
              <Localized
                en={`Faster than ${speedRank}% of Pokémon. At level ${PLAYER_LEVEL}, the faster Pokémon usually attacks first.`}
                pt={`Mais rápido que ${speedRank}% dos Pokémon. No nível ${PLAYER_LEVEL}, o mais rápido geralmente ataca primeiro.`}
              />
            </p>
          </Section>

          <Section en="Type matchups" pt="Confrontos de tipo">
            <p className="m-0 text-[.9rem] font-bold text-muted">
              <Localized
                en={`How much damage ${title} takes from each attack type.`}
                pt={`Quanto dano ${title} recebe de cada tipo de ataque.`}
              />
            </p>
            <TagRow
              en="Very weak to"
              pt="Muito fraco contra"
              note="4×"
              types={quadWeak}
            />
            <TagRow
              en="Weak to"
              pt="Fraco contra"
              note="2×"
              types={doubleWeak}
            />
            <TagRow en="Resists" pt="Resiste a" note="½×" types={halfResist} />
            <TagRow
              en="Strongly resists"
              pt="Resiste muito a"
              note="¼×"
              types={quadResist}
            />
            <TagRow en="Immune to" pt="Imune a" note="0×" types={immune} />
          </Section>
        </div>

        <Section en="Battle moveset" pt="Golpes em batalha">
          <p className="m-0 text-[.9rem] font-bold text-muted">
            <Localized
              en={`The moves ${title} uses in Draftmon's automatic battles. Moves that share one of its types get a 1.5× bonus.`}
              pt={`Os golpes que ${title} usa nas batalhas automáticas do Draftmon. Golpes de um dos seus tipos recebem bônus de 1,5×.`}
            />
          </p>
          <div className="overflow-x-auto rounded-2xl border-2 border-outline">
            <table className="w-full min-w-[480px] border-collapse text-left text-[.9rem]">
              <thead className="bg-panel-muted">
                <tr>
                  <th className="p-2.5">
                    <Localized en="Move" pt="Golpe" />
                  </th>
                  <th className="p-2.5">
                    <Localized en="Type" pt="Tipo" />
                  </th>
                  <th className="p-2.5">
                    <Localized en="Category" pt="Categoria" />
                  </th>
                  <th className="p-2.5 text-right">
                    <Localized en="Power" pt="Poder" />
                  </th>
                  <th className="p-2.5 text-right">
                    <Localized en="Accuracy" pt="Precisão" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {moves.map((move) => {
                  const category = CLASS_LABEL[move.damage_class.name] ?? [
                    displayName(move.damage_class.name),
                    displayName(move.damage_class.name),
                  ]
                  return (
                    <tr key={move.name} className="border-t-2 border-line">
                      <td className="p-2.5 font-extrabold">
                        <Localized
                          en={moveLabel(move.name)}
                          pt={moveLabel(
                            move.name,
                            'pt-BR',
                            gameData.moveTranslations,
                          )}
                        />
                        {types.includes(move.type.name) &&
                          move.damage_class.name !== 'status' && (
                            <span className="ml-1.5 text-[.7rem] text-muted">
                              1.5×
                            </span>
                          )}
                      </td>
                      <td className="p-2.5">
                        <TypeTag type={move.type.name} />
                      </td>
                      <td className="p-2.5">
                        <Localized en={category[0]} pt={category[1]} />
                      </td>
                      <td className="p-2.5 text-right font-pixel text-[.65rem]">
                        {move.power ?? '—'}
                      </td>
                      <td className="p-2.5 text-right font-pixel text-[.65rem]">
                        {move.accuracy ? `${move.accuracy}%` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <Section en="Where to draft it" pt="Onde capturar">
          {regions.length ? (
            <>
              <p className="m-0 font-bold">
                <Localized
                  en={`${title} can be offered when a roll lands on one of these regions together with one of its types (${types.map(displayName).join(' or ')}).`}
                  pt={`${title} pode aparecer quando o sorteio cair em uma destas regiões junto com um dos seus tipos.`}
                />
              </p>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {regions.map((region) => (
                  <li key={region.name}>
                    {regionPages.has(region.name) ? (
                      <Link
                        href={`/regions/${region.name}`}
                        className="inline-flex min-h-10 items-center rounded-xl border-2 border-outline bg-panel-muted px-3 font-extrabold text-ink no-underline hover:bg-accent hover:text-accent-ink"
                      >
                        {regionLabel(region)}
                      </Link>
                    ) : (
                      regionLabel(region)
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="m-0 font-bold">
              <Localized
                en={`${title} isn't listed in any regional Pokédex used for rolls.`}
                pt={`${title} não está em nenhuma Pokédex regional usada nos sorteios.`}
              />
            </p>
          )}
          {wildcard && (
            <p className="m-0 font-bold text-muted">
              <Localized
                en="As a Normal-type, it can also appear as a wildcard when a roll has too few matching Pokémon."
                pt="Por ser do tipo Normal, também pode aparecer como coringa quando o sorteio tem poucas opções."
              />
            </p>
          )}
          {rarity && (
            <p className="m-0 font-bold text-muted">
              <Localized
                en={`${rarity} Pokémon are limited to one per roll, so ${title} never shares a roll with another Legendary or Mythical.`}
                pt={`Pokémon ${rarity === 'Mythical' ? 'Míticos' : 'Lendários'} são limitados a um por sorteio, então ${title} nunca divide um sorteio com outro Lendário ou Mítico.`}
              />
            </p>
          )}
        </Section>

        {similar.length > 0 && (
          <Section en="Similar Pokémon" pt="Pokémon parecidos">
            <p className="m-0 text-[.9rem] font-bold text-muted">
              <Localized
                en={`Pokémon that share the ${displayName(types[0])} type with a similar base stat total.`}
                pt={`Pokémon que compartilham o mesmo tipo principal e têm total de atributos parecido.`}
              />
            </p>
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 p-0">
              {similar.map((other) => {
                const otherSprite = spriteOf(other)
                return (
                  <li key={other.name}>
                    <Link
                      href={`/pokedex/${other.name}`}
                      className="grid justify-items-center gap-1 rounded-2xl border-2 border-outline bg-panel-muted p-2.5 text-center font-extrabold text-ink no-underline hover:bg-accent hover:text-accent-ink"
                    >
                      {otherSprite && (
                        <Image
                          src={otherSprite}
                          alt=""
                          width={72}
                          height={72}
                          unoptimized
                          loading="lazy"
                          className="object-contain"
                        />
                      )}
                      {displayName(other.name)}
                      <span className="font-pixel text-[.6rem] text-muted">
                        {baseStatTotal(other)}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Section>
        )}
      </div>
    </PublicPage>
  )
}
