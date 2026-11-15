'use client'

import Image from 'next/image'
import { Button } from '../ui/Button'
import { useEffect } from 'react'
import { setLanguage, useLanguage } from '../../services/language'
import { setTheme, useTheme } from '../../services/theme'

const languages = [
  { id: 'en', label: 'English', flag: 'us' },
  { id: 'pt-BR', label: 'Português (Brasil)', flag: 'br' },
] as const

export function Preferences() {
  const { language, t } = useLanguage()
  const theme = useTheme()
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <>
      <div
        role="group"
        aria-label={t('Language', 'Idioma')}
        className="inline-flex items-center gap-1 rounded-xl border border-line bg-panel-muted p-1"
      >
        {languages.map(({ id, label, flag }) => (
          <button
            key={id}
            type="button"
            className="grid h-8 w-11 cursor-pointer place-items-center rounded-lg border border-transparent hover:border-brand focus-visible:outline-2 focus-visible:outline-brand aria-pressed:border-brand aria-pressed:bg-panel"
            aria-label={label}
            aria-pressed={language === id}
            onClick={() => setLanguage(id)}
          >
            <Image
              src={`/flags/${flag}.svg`}
              width={27}
              height={18}
              alt=""
              className="rounded-[2px]"
            />
          </button>
        ))}
      </div>
      <Button
        type="button"
        icon
        size="custom"
        className="size-9 rounded-lg text-[1.1rem]"
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
