'use client'

import { Button } from '../ui/Button'
import { useEffect } from 'react'
import { setLanguage, useLanguage } from '../../services/language'
import { setTheme, useTheme } from '../../services/theme'

export function Preferences() {
  const { language, t } = useLanguage()
  const theme = useTheme()
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <>
      <select
        className="max-w-35.5 rounded-lg border border-line bg-panel px-[5px] py-[7px] font-[inherit] text-[.82rem] leading-[inherit] text-ink"
        aria-label={t('Language', 'Idioma')}
        value={language}
        onChange={(event) =>
          setLanguage(event.target.value === 'pt-BR' ? 'pt-BR' : 'en')
        }
      >
        <option value="en">English</option>
        <option value="pt-BR">Português (Brasil)</option>
      </select>
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
