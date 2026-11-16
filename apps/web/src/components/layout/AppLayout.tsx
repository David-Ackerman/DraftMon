import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { AccountMenu } from '../account/AccountMenu'
import type { Account } from '../../services/account'
import { sound } from '../../services/sound'
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
      <div className="mx-auto flex w-full max-w-[1180px] min-w-0 flex-1 flex-col px-4 pt-6 pb-6">
        <main ref={reportSurface} className="min-w-0 flex-1">
          {children}
        </main>
        {/* Sticks to the bottom of the viewport while scrolling, but stays in
            the content column so it never covers the footer. */}
        <div className="sticky bottom-4 z-40 mt-6 ml-auto w-fit">
          <BugReport game={accountPage ? null : () => reportSurface.current} />
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
