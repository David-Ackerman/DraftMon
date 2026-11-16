'use client'

import Image from 'next/image'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { setLanguage, useLanguage } from '../../services/language'
import type { Language } from '../../services/language'
import { setTheme, useTheme } from '../../services/theme'

const languages = [
  { id: 'en', label: 'English', code: 'EN', flag: 'us' },
  { id: 'pt-BR', label: 'Português (Brasil)', code: 'PT', flag: 'br' },
] as const satisfies readonly {
  id: Language
  label: string
  code: string
  flag: string
}[]

function Flag({ flag, size }: { flag: string; size: 'small' | 'large' }) {
  const [width, height] = size === 'small' ? [26, 17] : [34, 23]
  return (
    <Image
      src={`/flags/${flag}.svg`}
      width={width}
      height={height}
      alt=""
      loading="eager"
      className="rounded-[3px] border border-[#14204a33]"
    />
  )
}

export function LanguageSelect() {
  const { language, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const listId = useId()
  const label = t('Language', 'Idioma')
  const selectedIndex = Math.max(
    0,
    languages.findIndex(({ id }) => id === language),
  )
  const current = languages[selectedIndex]

  useEffect(() => {
    if (!open) return
    list.current?.focus()
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  function show() {
    setActive(selectedIndex)
    setOpen(true)
  }

  function close() {
    setOpen(false)
    trigger.current?.focus()
  }

  function choose(index: number) {
    setLanguage(languages[index].id)
    close()
  }

  function onTriggerKey(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      show()
    }
  }

  function onListKey(event: KeyboardEvent) {
    const last = languages.length - 1
    const moves: Record<string, number> = {
      ArrowDown: active === last ? 0 : active + 1,
      ArrowUp: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    }
    if (event.key in moves) {
      event.preventDefault()
      setActive(moves[event.key])
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(active)
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      event.stopPropagation()
      if (event.key === 'Escape') event.preventDefault()
      close()
    }
  }

  return (
    <div
      ref={root}
      className="language-select relative compact-interaction:has-[[role=listbox]]:basis-full"
    >
      <button
        ref={trigger}
        type="button"
        className="silent inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border-3 border-outline bg-panel px-2.5 font-display text-base text-ink shadow-[0_3px_0_var(--outline)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffcb05]"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${current.label}`}
        onClick={() => (open ? close() : show())}
        onKeyDown={onTriggerKey}
      >
        <Flag flag={current.flag} size="small" />
        <span aria-hidden="true">{current.code}</span>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn('transition-transform', open && 'rotate-180')}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
          className="absolute top-[calc(100%+10px)] right-0 z-30 m-0 grid w-64 list-none gap-1 rounded-2xl border-3 border-outline bg-panel p-1.5 shadow-[5px_5px_0_var(--outline)] outline-none compact-interaction:static compact-interaction:mt-2 compact-interaction:w-full"
        >
          {languages.map(({ id, label: name, flag }, index) => (
            <li
              key={id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={id === language}
              lang={id}
              className={cn(
                'flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-2.5 py-1.5 font-extrabold text-ink',
                id === language
                  ? 'border-[#ffcb05] bg-[#ffcb0533]'
                  : 'border-transparent',
                index === active && id !== language && 'bg-panel-muted',
              )}
              onPointerEnter={() => setActive(index)}
              onClick={() => choose(index)}
            >
              <Flag flag={flag} size="large" />
              <span className="flex-1">{name}</span>
              {id === language && (
                <Image src="/pokeball.svg" width={20} height={20} alt="" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Preferences() {
  const { language, t } = useLanguage()
  const theme = useTheme()
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <>
      <LanguageSelect />
      <Button
        type="button"
        icon
        size="custom"
        className="size-11 rounded-xl border-3 text-[1.15rem] shadow-[0_3px_0_var(--outline)]"
        aria-label={t('Dark mode', 'Modo escuro')}
        title={t('Dark mode', 'Modo escuro')}
        aria-pressed={theme === 'dark'}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
      </Button>
    </>
  )
}
