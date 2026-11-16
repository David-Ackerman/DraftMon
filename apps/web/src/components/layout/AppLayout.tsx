import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { AccountMenu } from '../account/AccountMenu'
import type { Account } from '../../services/account'
import { sound } from '../../services/sound'
import { AdSlot, SideAds } from './Ads'
import { AudioSettings } from './AudioSettings'
import { BugReport } from './BugReport'
import { Preferences } from './Preferences'
import { SiteFooter } from './SiteFooter'
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
    <div className="flex min-h-dvh flex-col">
      <SiteHeader progress={progress} onGameHome={onHome}>
        <Preferences />
        {profileAction}
        {sessionReady && (
          <AccountMenu account={account} onChange={onAccountChange} />
        )}
        <AudioSettings />
      </SiteHeader>
      <div className="grid flex-1 grid-cols-[auto_minmax(0,1180px)_auto] items-start justify-center">
        {!accountPage && <SideAds />}
        <div className="min-w-0 px-4 pt-6 pb-10 [grid-area:1_/_2]">
          <main ref={reportSurface}>{children}</main>
          {!accountPage && <AdSlot placement="bottom" />}
        </div>
      </div>
      <SiteFooter />
      <BugReport game={accountPage ? null : () => reportSurface.current} />
    </div>
  )
}
