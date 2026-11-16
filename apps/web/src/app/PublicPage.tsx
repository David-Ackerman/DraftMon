import type { ReactNode } from 'react'
import { Preferences } from '../components/layout/Preferences'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'

export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader>
        <Preferences />
      </SiteHeader>
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 pt-6 pb-12">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
