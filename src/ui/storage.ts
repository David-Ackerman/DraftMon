/** Guest progress kept in this browser only (accounts come later). */
export interface PlayerStats {
  runs: number
  best: number
  perfect: number
  dailyBest: Record<string, number>
}

const KEY = 'draft-league-stats-v1'
const empty = (): PlayerStats => ({ runs: 0, best: 0, perfect: 0, dailyBest: {} })

export function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty()
  } catch {
    return empty()
  }
}

export function recordRun(wins: number, perfect: boolean, mode: 'random' | 'daily', day: string): PlayerStats {
  const s = loadStats()
  s.runs++
  s.best = Math.max(s.best, wins)
  if (perfect) s.perfect++
  if (mode === 'daily') s.dailyBest[day] = Math.max(s.dailyBest[day] ?? 0, wins)
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* storage unavailable: stats just won't persist */
  }
  return s
}
