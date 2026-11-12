import { useMemo, useRef, useState } from 'react'
import { gameData } from './engine/data'
import { chart } from './ui/chart'
import { createRng, seedFromString } from './engine/rng'
import type { Rng } from './engine/rng'
import type { BattleResult } from './engine/battle'
import { simulateBattle } from './engine/battle'
import type { LeagueMatch, RerollMode, Roll } from './engine/game'
import { createLeague, PLAYER_LEVEL, REROLLS_PER_RUN, rollOptions, TEAM_SIZE, trainerTeamForMatch } from './engine/game'
import { Home } from './ui/Home'
import { Draft } from './ui/Draft'
import { Prep } from './ui/Prep'
import { BattleView } from './ui/BattleView'
import { RunEnd } from './ui/RunEnd'
import { loadStats, recordRun } from './ui/storage'

type Phase = 'home' | 'draft' | 'prep' | 'battle' | 'end'

export interface Run {
  seed: number
  mode: 'random' | 'daily'
  team: string[]
  roll: Roll | null
  rerollsLeft: number
  league: LeagueMatch[]
  matchIndex: number
  results: boolean[]
}

const today = () => new Date().toISOString().slice(0, 10)

export default function App() {
  const [phase, setPhase] = useState<Phase>('home')
  const [run, setRun] = useState<Run | null>(null)
  const [battle, setBattle] = useState<BattleResult | null>(null)
  const [stats, setStats] = useState(loadStats)
  const rngRef = useRef<Rng>(createRng(1))

  const startRun = (mode: 'random' | 'daily') => {
    const seed = mode === 'daily' ? seedFromString(`daily-${today()}`) : (Math.random() * 2 ** 32) >>> 0
    const rng = createRng(seed)
    rngRef.current = rng
    const league = createLeague(gameData, rng)
    setRun({
      seed,
      mode,
      team: [],
      roll: rollOptions(gameData, rng, []),
      rerollsLeft: REROLLS_PER_RUN,
      league,
      matchIndex: 0,
      results: [],
    })
    setBattle(null)
    setPhase('draft')
  }

  const pickCreature = (name: string) => {
    if (!run) return
    const team = [...run.team, name]
    const done = team.length >= TEAM_SIZE
    setRun({ ...run, team, roll: done ? null : rollOptions(gameData, rngRef.current, team) })
    if (done) setPhase('prep')
  }

  const reroll = (mode: RerollMode) => {
    if (!run?.roll || run.rerollsLeft <= 0) return
    setRun({
      ...run,
      rerollsLeft: run.rerollsLeft - 1,
      roll: rollOptions(gameData, rngRef.current, run.team, mode, run.roll),
    })
  }

  const startBattle = (order: string[]) => {
    if (!run) return
    const match = run.league[run.matchIndex]
    const rng = rngRef.current
    const result = simulateBattle(
      order.map((name) => ({ name })),
      trainerTeamForMatch(match.trainer, rng),
      {
        data: gameData,
        chart,
        rng,
        levels: [PLAYER_LEVEL, match.trainer.level],
        names: ['You', `${match.trainer.title} ${match.trainer.name}`],
      },
    )
    setRun({ ...run, team: order })
    setBattle(result)
    setPhase('battle')
  }

  const finishBattle = () => {
    if (!run || !battle) return
    const won = battle.winner === 0
    const results = [...run.results, won]
    const next: Run = { ...run, results, matchIndex: run.matchIndex + 1 }
    setRun(next)
    setBattle(null)
    if (!won || next.matchIndex >= run.league.length) {
      setStats(recordRun(results.filter(Boolean).length, results.length === run.league.length && won, run.mode, today()))
      setPhase('end')
    } else setPhase('prep')
  }

  const content = useMemo(() => {
    switch (phase) {
      case 'home':
        return <Home stats={stats} onStart={startRun} />
      case 'draft':
        return run?.roll ? <Draft run={run} onPick={pickCreature} onReroll={reroll} /> : null
      case 'prep':
        return run ? <Prep run={run} onStart={startBattle} /> : null
      case 'battle':
        return run && battle ? (
          <BattleView result={battle} match={run.league[run.matchIndex]} onDone={finishBattle} />
        ) : null
      case 'end':
        return run ? <RunEnd run={run} onAgain={() => startRun('random')} onHome={() => setPhase('home')} /> : null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, run, battle, stats])

  return (
    <div className="app">
      <header className="topbar">
        <button className="logo" onClick={() => setPhase('home')}>
          Draft<span>League</span>
        </button>
        {run && phase !== 'home' && phase !== 'end' && (
          <div className="run-progress">
            {run.league.map((m, i) => (
              <span
                key={m.trainer.id}
                className={`pip ${i < run.results.length ? (run.results[i] ? 'won' : 'lost') : i === run.matchIndex && phase !== 'draft' ? 'current' : ''}`}
                title={`${m.stage}: ${m.trainer.name}`}
              />
            ))}
          </div>
        )}
      </header>
      <main>{content}</main>
    </div>
  )
}
