import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { Preferences } from '../components/layout/Preferences'
import { Localized } from '../components/ui/Localized'

export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-12">
      <nav
        aria-label="Main navigation"
        className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b-3 border-[color:var(--red)] py-3.5"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-extrabold text-brand no-underline"
        >
          <Image src="/pokeball.svg" width={30} height={30} alt="" />
          Draftmon
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
          <Link href="/play" className="text-brand">
            <Localized en="Play" pt="Jogar" />
          </Link>
          <Link href="/lobby" className="text-brand">
            <Localized en="Tournaments" pt="Torneios" />
          </Link>
          <Link href="/pokedex" className="text-brand">
            Pokédex
          </Link>
          <Link href="/how-to-play" className="text-brand">
            <Localized en="How to play" pt="Como jogar" />
          </Link>
          <Preferences />
        </div>
      </nav>
      <main>{children}</main>
      <footer className="mt-10 border-t border-line px-3 pt-4 text-center text-sm text-muted">
        <Localized
          en="Draftmon is an independent fan project. Pokémon materials belong to their respective rights holders."
          pt="Draftmon é um projeto de fã independente. Os materiais de Pokémon pertencem aos respectivos titulares."
        />
      </footer>
    </div>
  )
}
