'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLanguage } from '../../services/language'
import { cn } from '../ui/cn'

const pages = [
  { href: '/', en: 'Home', pt: 'Início' },
  { href: '/play', en: 'Play', pt: 'Jogar' },
  { href: '/lobby', en: 'Tournaments', pt: 'Torneios' },
  { href: '/pokedex', en: 'Pokédex', pt: 'Pokédex' },
  { href: '/how-to-play', en: 'How to play', pt: 'Como jogar' },
]

const brandClass =
  'inline-flex items-center gap-2 no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffcb05]'
const brand = (
  <>
    <Image
      src="/pokeball.svg"
      width={40}
      height={40}
      alt=""
      className="drop-shadow-[0_3px_0_#14204a] phone-header:size-8"
    />
    <span className="wordmark text-[2rem] leading-none phone-header:text-[1.6rem]">
      Draftmon
    </span>
  </>
)

export function SiteHeader({
  children,
  progress,
  onGameHome,
}: {
  children: ReactNode
  progress?: ReactNode
  onGameHome?: () => void
}) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const header = useRef<HTMLElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function closeOutside(event: PointerEvent) {
      if (!header.current?.contains(event.target as Node)) setOpen(false)
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      menuButton.current?.focus()
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <header
      ref={header}
      className="relative z-20 border-b-[6px] border-outline bg-header"
    >
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        {onGameHome && (
          <button
            type="button"
            className={cn(
              brandClass,
              'cursor-pointer compact-interaction:hidden',
            )}
            onClick={onGameHome}
          >
            {brand}
          </button>
        )}
        <Link
          href="/"
          aria-label={t('Draftmon home', 'Início do Draftmon')}
          className={cn(
            brandClass,
            onGameHome && 'hidden compact-interaction:inline-flex',
          )}
          onClick={() => setOpen(false)}
        >
          {brand}
        </Link>
        <button
          ref={menuButton}
          type="button"
          className="silent hidden size-11 cursor-pointer place-items-center rounded-xl border-3 border-outline bg-accent text-accent-ink shadow-[0_3px_0_var(--outline)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white compact-interaction:grid"
          aria-label={
            open ? t('Close menu', 'Fechar menu') : t('Open menu', 'Abrir menu')
          }
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen(!open)}
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path
              d={open ? 'M6 6l12 12M18 6 6 18' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
        {progress && (
          <div className="compact-interaction:order-last compact-interaction:w-full">
            {progress}
          </div>
        )}
        <div
          id={menuId}
          className={cn(
            'ml-auto flex min-w-0 flex-wrap items-center gap-3 text-sm font-bold compact-interaction:order-3 compact-interaction:mb-2 compact-interaction:w-full compact-interaction:flex-col compact-interaction:items-stretch compact-interaction:rounded-2xl compact-interaction:border-3 compact-interaction:border-outline compact-interaction:bg-panel compact-interaction:p-3 compact-interaction:shadow-[5px_5px_0_var(--outline)]',
            !open && 'compact-interaction:hidden',
          )}
        >
          <nav
            aria-label={t('Main navigation', 'Navegação principal')}
            className={cn(
              'items-center gap-1 compact-interaction:grid compact-interaction:grid-cols-2 compact-interaction:gap-1.5',
              onGameHome ? 'hidden' : 'flex flex-wrap',
            )}
          >
            {pages.map(({ href, en, pt }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={
                  (href === '/' ? pathname === '/' : pathname?.startsWith(href))
                    ? 'page'
                    : undefined
                }
                className={cn(
                  'rounded-xl px-3 py-2.5 text-[.95rem] font-black text-white no-underline hover:bg-[#14204a33] focus-visible:outline-2 focus-visible:outline-white aria-[current=page]:bg-outline',
                  'compact-interaction:border-2 compact-interaction:border-outline compact-interaction:bg-panel-muted compact-interaction:text-ink compact-interaction:aria-[current=page]:bg-accent compact-interaction:aria-[current=page]:text-accent-ink',
                  href === '/' && 'hidden compact-interaction:block',
                )}
              >
                {t(en, pt)}
              </Link>
            ))}
          </nav>
          <div
            className="flex min-w-0 flex-wrap items-center gap-2.5 compact-interaction:pt-1 compact-interaction:[&_.account-menu:has(.account-panel)]:basis-full compact-interaction:[&_.account-panel]:static compact-interaction:[&_.account-panel]:mt-2 compact-interaction:[&_.account-panel]:w-full compact-interaction:[&_.audio-panel]:static compact-interaction:[&_.audio-panel]:mt-2 compact-interaction:[&_.audio-panel]:w-full compact-interaction:[&_.audio-settings:has(.audio-panel)]:basis-full"
            onClick={(event) => {
              if ((event.target as Element).closest('[data-close-header]'))
                setOpen(false)
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </header>
  )
}
