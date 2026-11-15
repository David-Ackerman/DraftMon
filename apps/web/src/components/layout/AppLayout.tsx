import Image from 'next/image'
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
        <header className="topbar mb-5 flex flex-wrap items-center justify-between gap-3 px-0 py-3.5 [border-bottom:3px_solid_var(--red)]">
          <button
            className="logo inline-flex cursor-pointer items-center gap-[7px] border-0 bg-none p-0 text-[1.35rem] font-extrabold tracking-[-.02em] text-ink phone:flex-wrap phone:gap-1 phone:text-[.9rem] phone:[&_img]:h-6 phone:[&_img]:w-6 [&_span]:text-brand"
            onClick={onHome}
          >
            <Image
              src="/pokeball.svg"
              alt=""
              width={30}
              height={30}
              unoptimized
              loading="eager"
            />
            <span>Draftmon</span>
          </button>
          <div className="topbar-right ml-auto flex min-w-0 flex-wrap items-center justify-end gap-3.5 phone:gap-2 phone-header:gap-y-1.5 compact-layout:[&_.run-progress]:[order:1]">
            {progress}
            <Preferences />
            {profileAction}
            {sessionReady && (
              <AccountMenu account={account} onChange={onAccountChange} />
            )}
            <AudioSettings />
          </div>
        </header>
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
