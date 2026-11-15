import type { Metadata } from 'next'
import Link from 'next/link'
import { gameData } from '@draftmon/content'
import { regionalPokedex } from '@draftmon/engine'
import { PublicPage } from '../PublicPage'
import { publicMetadata } from '../site'

export const metadata: Metadata = publicMetadata(
  'Pokédex',
  'Browse the Pokémon and regions available in Draftmon.',
  '/pokedex',
)

export default function Page() {
  return (
    <PublicPage>
      <h1>Pokédex</h1>
      <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {regionalPokedex(gameData).map(({ region, pokemon }) => (
          <li
            key={region.name}
            className="rounded-panel border border-line bg-panel p-4"
          >
            <Link
              href={`/regions/${region.name}`}
              className="font-semibold text-brand capitalize"
            >
              {region.name}
            </Link>
            <p>{pokemon.length} Pokémon</p>
          </li>
        ))}
      </ul>
    </PublicPage>
  )
}
