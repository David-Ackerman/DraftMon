import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PublicPage } from './PublicPage'
import { publicMetadata } from './site'
import { HeroPokemon, heroPanel } from '../components/pokemon/HeroPokemon'
import { Localized } from '../components/ui/Localized'

export const metadata: Metadata = publicMetadata(
  'Draftmon',
  'Draft six Pokémon and battle in a solo league or a tournament with friends.',
  '/',
)

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>
}) {
  const { room } = await searchParams
  if (typeof room === 'string' && /^[a-f0-9]{8}$/i.test(room))
    redirect('/lobby/' + room.toUpperCase())
  return (
    <PublicPage>
      <section className={heroPanel}>
        <HeroPokemon />
        <h1>
          <Localized
            en="Build your Pokémon team."
            pt="Monte sua equipe Pokémon."
          />
        </h1>
        <p className="max-w-lg text-lg text-muted">
          <Localized
            en="Catch six Pokémon by region and type, choose your battle order, and take on the league."
            pt="Capture seis Pokémon por região e tipo, escolha a ordem da equipe e enfrente a liga."
          />
        </p>
        <Link
          href="/play"
          className="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-ink no-underline"
        >
          <Localized en="Play Draftmon" pt="Jogar Draftmon" />
        </Link>
      </section>
    </PublicPage>
  )
}
