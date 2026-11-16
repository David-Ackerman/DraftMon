import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PublicPage } from './PublicPage'
import { publicMetadata } from './site'
import Image from 'next/image'
import { Showcase } from '../components/pokemon/Showcase'
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
      <section className="flex flex-wrap gap-6 rounded-[24px] border-3 border-outline bg-panel p-8 shadow-[6px_6px_0_var(--outline)] phone:p-5">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col items-start gap-4">
          <h1 className="m-0">
            <Localized
              en="Build your Pokémon team."
              pt="Monte sua equipe Pokémon."
            />
          </h1>
          <p className="m-0 max-w-lg text-lg font-bold text-muted">
            <Localized
              en="Catch six Pokémon by region and type, choose your battle order, and take on the league."
              pt="Capture seis Pokémon por região e tipo, escolha a ordem da equipe e enfrente a liga."
            />
          </p>
          <Link
            href="/play"
            className="inline-flex min-h-14 items-center gap-2.5 rounded-2xl border-3 border-outline bg-accent px-7 py-3 font-display text-[1.3rem] text-accent-ink no-underline shadow-[0_5px_0_var(--outline)] hover:bg-[#ffd84a]"
          >
            <Image src="/pokeball.svg" width={26} height={26} alt="" />
            <Localized en="Play Draftmon" pt="Jogar Draftmon" />
          </Link>
        </div>
        <Showcase className="flex-[1_1_300px]" />
      </section>
    </PublicPage>
  )
}
