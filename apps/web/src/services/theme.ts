import { useEffect, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'
const key = 'draft-league-theme'
const listeners = new Set<() => void>()
let current: Theme | undefined

function getTheme(): Theme {
  if (current) return current
  try {
    const saved = localStorage.getItem(key)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    /* Fall back to the system preference. */
  }
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setTheme(theme: Theme) {
  current = theme
  try {
    localStorage.setItem(key, theme)
  } catch {
    /* Keep this preference for the current visit. */
  }
  listeners.forEach((listener) => listener())
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getTheme,
    () => 'light' as const,
  )
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  return theme
}
