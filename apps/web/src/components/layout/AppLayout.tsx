import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { AccountMenu } from '../account/AccountMenu'
import type { Account } from '../../services/account'
import { useLanguage } from '../../services/language'
import { sound } from '../../services/sound'
import { AdSlot, SideAds } from './Ads'
import { AudioSettings } from './AudioSettings'
import { BugReport } from './BugReport'
import { Preferences } from './Preferences'
import { SiteHeader } from './SiteHeader'

export function AppLayout({
  accountPage,
  account,
  sessionReady,
  onAccountChange,
  onHome,
  progress,
  profileAction,
  children,
}: {
  accountPage?: boolean
  account: Account | null
  sessionReady: boolean
  onAccountChange: (account: Account | null) => void
  onHome: () => void
  progress?: ReactNode
  profileAction?: ReactNode
  children: ReactNode
}) {
  const { t } = useLanguage()
  const reportSurface = useRef<HTMLElement>(null)
  // Unlock audio from both pointer and keyboard interactions.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      sound.unlock()
      const btn = (e.target as HTMLElement).closest('button')
      if (btn && !btn.disabled && !btn.classList.contains('silent'))
        sound.play('click')
    }
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      sound.dispose()
    }
  }, [])

  return (
    <div className="grid grid-cols-[auto_minmax(0,1180px)_auto] justify-center">
      {!accountPage && <SideAds />}
      <div className="min-w-0 px-4 pt-0 pb-12 [grid-area:1_/_2]">
        <SiteHeader progress={progress} onGameHome={onHome}>
          <Preferences />
          {profileAction}
          {sessionReady && (
            <AccountMenu account={account} onChange={onAccountChange} />
          )}
          <AudioSettings />
        </SiteHeader>
        <main ref={reportSurface}>{children}</main>
        {!accountPage && <AdSlot placement="bottom" />}
        <footer className="mt-10 grid gap-1 border-t border-line px-3 pt-4.5 text-center text-[.82rem] text-muted">
          <p className="m-0">
            {t(
              'Draftmon is an independent fan project with no official affiliation.',
              'Draftmon é um projeto de fã independente, sem afiliação oficial.',
            )}
          </p>
          <p className="m-0">
            {t(
              'Pokémon, its characters and franchise materials belong to their respective rights holders.',
              'Pokémon, seus personagens e os materiais da franquia pertencem aos respectivos titulares.',
            )}
          </p>
        </footer>
      </div>
      <BugReport game={accountPage ? null : () => reportSurface.current} />
    </div>
  )
}
