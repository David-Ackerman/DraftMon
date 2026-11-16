'use client'

import { useLanguage } from '../../services/language'
import { Spinner } from '../ui/Spinner'
import { Preferences } from './Preferences'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

function Block({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-panel border-3 border-line bg-panel/70 motion-safe:animate-skeleton ${className}`}
    />
  )
}

/**
 * Server-rendered stand-in while a game screen's code downloads: the real
 * header and footer paint at once, and only the content area waits.
 */
export function LoadingShell() {
  const { t } = useLanguage()
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader>
        <Preferences />
      </SiteHeader>
      <main className="mx-auto grid w-full max-w-[1180px] flex-1 content-start gap-6 px-4 pt-6 pb-10">
        <div className="relative">
          <Block className="h-[300px] phone:h-[420px]" />
          <Spinner
            size="large"
            label={t('Loading the game…', 'Carregando o jogo…')}
            className="absolute inset-0 content-center"
          />
        </div>
        <Block className="h-[120px]" />
        <Block className="h-[160px]" />
      </main>
      <SiteFooter />
    </div>
  )
}
