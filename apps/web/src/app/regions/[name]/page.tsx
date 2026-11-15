import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { gameData } from '@draftmon/content'
import {
  displayName,
  regionLabel,
  regionalPokedex,
  spriteOf,
} from '@draftmon/engine'
import { PublicPage } from '../../PublicPage'
import { publicMetadata } from '../../site'
import { regions as lore } from '../../../components/pokemon/lore'
import { Localized } from '../../../components/ui/Localized'
import { RegionPokemonGrid } from '../../../components/pokemon/RegionPokemonGrid'

const regions = new Map(
  regionalPokedex(gameData).map((entry) => [entry.region.name, entry]),
)
export const generateStaticParams = () =>
  [...regions.keys()].map((name) => ({ name }))

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>
}): Promise<Metadata> {
  const { name } = await params
  const entry = regions.get(name)
  if (!entry) notFound()
  return publicMetadata(
    regionLabel(entry.region),
    `Browse the Pokémon from ${regionLabel(entry.region)} available in Draftmon.`,
    '/regions/' + name,
    '/regions/' + name + '.webp',
  )
}

export default async function Page({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const entry = regions.get(name)
  if (!entry) notFound()
  const info = lore[name]
  return (
    <PublicPage>
      <section className="mb-5 grid gap-5 rounded-panel border border-line bg-panel p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-center">
        <Image
          src={`/regions/${name}.webp`}
          alt={regionLabel(entry.region)}
          width={480}
          height={300}
          className="h-auto w-full rounded-lg object-contain"
          unoptimized
          loading="eager"
        />
        <div>
          <h1>{regionLabel(entry.region)}</h1>
          {info && (
            <>
              <p className="font-semibold text-brand">
                {info[0]} · <Localized en="Generation" pt="Geração" /> {info[1]}
              </p>
              <p>
                <Localized en={info[2]} pt={info[3]} />
              </p>
            </>
          )}
        </div>
      </section>
      <RegionPokemonGrid>
        {entry.pokemon.map(({ pokemon }) => (
          <li
            key={pokemon.name}
            className="min-w-0 rounded-panel border border-line bg-panel text-center"
          >
            <Link
              href={`/pokedex/${pokemon.name}`}
              data-pokemon={pokemon.name}
              className="grid h-full place-content-center gap-1 rounded-panel p-2 text-sm font-semibold wrap-anywhere text-brand no-underline hover:bg-panel-muted focus-visible:outline-2 focus-visible:outline-brand"
            >
              {spriteOf(pokemon) && (
                <Image
                  src={spriteOf(pokemon)}
                  alt=""
                  width={72}
                  height={72}
                  className="mx-auto block object-contain"
                  unoptimized
                />
              )}
              {displayName(pokemon.name)}
            </Link>
          </li>
        ))}
      </RegionPokemonGrid>
    </PublicPage>
  )
}
