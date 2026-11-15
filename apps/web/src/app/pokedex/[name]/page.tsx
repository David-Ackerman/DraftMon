import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { gameData } from '@draftmon/content'
import { displayName, spriteOf, typesOf } from '@draftmon/engine'
import { PublicPage } from '../../PublicPage'
import { publicMetadata, siteUrl } from '../../site'
import { Localized } from '../../../components/ui/Localized'

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
  return publicMetadata(
    displayName(name),
    pokemon.species?.descriptions?.en ??
      `Draftmon stats and types for ${displayName(name)}.`,
    '/pokedex/' + name,
    spriteOf(pokemon) || undefined,
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
  const description = pokemon.species?.descriptions?.en
  const sprite = spriteOf(pokemon)
  const structured = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
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
      <article className="rounded-panel border border-line bg-panel p-5">
        <h1>{title}</h1>
        {sprite && (
          <Image
            src={sprite}
            alt={title}
            width={160}
            height={160}
            unoptimized
            preload
            className="object-contain"
          />
        )}
        <p className="capitalize">{typesOf(pokemon).join(' · ')}</p>
        {description && (
          <p>
            <Localized
              en={description}
              pt={
                pokemon.species?.descriptions?.['pt-BR'] ??
                'Descrição indisponível.'
              }
            />
          </p>
        )}
        <h2>
          <Localized en="Base stats" pt="Atributos base" />
        </h2>
        <dl className="grid max-w-sm grid-cols-2 gap-2">
          {pokemon.stats.map(({ stat, base_stat }) => (
            <div key={stat.name}>
              <dt className="capitalize">{displayName(stat.name)}</dt>
              <dd className="m-0 font-semibold">{base_stat}</dd>
            </div>
          ))}
        </dl>
      </article>
    </PublicPage>
  )
}
