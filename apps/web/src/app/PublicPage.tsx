import type { ReactNode } from 'react'
import { Preferences } from '../components/layout/Preferences'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Localized } from '../components/ui/Localized'

export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-12">
      <SiteHeader>
        <Preferences />
      </SiteHeader>
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
