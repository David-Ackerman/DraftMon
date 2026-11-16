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
      <ul className="grid list-none grid-cols-2 gap-2 p-0 sm:gap-3 lg:grid-cols-3">
        {regionalPokedex(gameData).map(({ region, pokemon }) => (
          <li
            key={region.name}
            className="rounded-panel border-3 border-outline bg-panel shadow-[5px_5px_0_var(--outline)]"
          >
            <Link
              href={`/regions/${region.name}`}
              className="grid h-full gap-1 rounded-panel p-3 font-semibold text-brand capitalize no-underline hover:bg-panel-muted focus-visible:outline-2 focus-visible:outline-brand sm:p-4"
            >
              {region.name}
              <span className="text-sm font-normal text-muted">
                {pokemon.length} Pokémon
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PublicPage>
  )
}
