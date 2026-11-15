import { Button } from '../ui/Button'
import { useEffect, useState } from 'react'
import { setLanguage, useLanguage } from '../../services/language'

const THEME_KEY = 'draft-league-theme'

function initialTheme() {
  try {
    const theme = localStorage.getItem(THEME_KEY)
    if (theme === 'dark' || theme === 'light') return theme
  } catch { /* Fall back to the system preference. */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function Preferences() {
  const { language, t } = useLanguage()
  const [theme, setTheme] = useState(initialTheme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* Keep this preference for the current visit. */ }
  }, [theme])

  return (
    <>
      <select className="text-ink bg-panel border border-line rounded-lg py-[7px] px-[5px] [font-family:inherit] [line-height:inherit] text-[.82rem] max-w-35.5" aria-label={t('Language', 'Idioma')} value={language} onChange={(event) => setLanguage(event.target.value === 'pt-BR' ? 'pt-BR' : 'en')}>
        <option value="en">English</option>
        <option value="pt-BR">Português (Brasil)</option>
      </select>
      <Button type="button" icon size="custom" className="size-9 rounded-lg text-[1.1rem]" aria-label={t('Dark mode', 'Modo escuro')} title={t('Dark mode', 'Modo escuro')} aria-pressed={theme === 'dark'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
      </Button>
    </>
  )
}
