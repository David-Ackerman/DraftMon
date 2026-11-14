import { useEffect, useMemo, useRef, useState } from 'react'
import { gameData } from './engine/data'
import { chart } from './ui/chart'
import { createRng, seedFromString } from './engine/rng'
import type { Rng } from './engine/rng'
import type { BattleResult } from './engine/battle'
import { simulateBattle } from './engine/battle'
import type { LeagueMatch, RerollMode, Roll } from './engine/game'
import { createLeague, PLAYER_LEVEL, REROLLS_PER_RUN, rollOptions, TEAM_SIZE, trainerTeamForMatch } from './engine/game'
import type { MatchSummary } from './engine/summary'
import { summarizeBattle } from './engine/summary'
import { Home } from './ui/Home'
import { Draft } from './ui/Draft'
import { Prep } from './ui/Prep'
import { BattleView } from './ui/BattleView'
import { RunEnd } from './ui/RunEnd'
import { loadName, loadStats, recordRun, saveName } from './ui/storage'
import { AudioSettings } from './ui/AudioSettings'
import { sound } from './ui/sound'

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
  summaries: MatchSummary[]
}

const today = () => new Date().toISOString().slice(0, 10)

export default function App() {
  const [phase, setPhase] = useState<Phase>('home')
  const [run, setRun] = useState<Run | null>(null)
  const [battle, setBattle] = useState<BattleResult | null>(null)
  const [stats, setStats] = useState(loadStats)
  const [name, setName] = useState(loadName)
  const rngRef = useRef<Rng>(createRng(1))
  const playerName = name.trim() || 'Player'

  // audio can only start after a user gesture; every button press also clicks
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      sound.unlock()
      const btn = (e.target as HTMLElement).closest('button')
      if (btn && !btn.disabled && !btn.classList.contains('silent')) sound.play('click')
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [])

  useEffect(() => {
    sound.setMusic(phase === 'battle' ? 'battle' : 'menu')
  }, [phase])

  const changeName = (n: string) => {
    setName(n)
    saveName(n)
  }

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
      summaries: [],
    })
    setBattle(null)
    setPhase('draft')
  }

  const pickCreature = (creature: string) => {
    if (!run) return
    const team = [...run.team, creature]
    sound.play('pick')
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
      order.map((n) => ({ name: n })),
      trainerTeamForMatch(match.trainer, rng),
      {
        data: gameData,
        chart,
        rng,
        levels: [PLAYER_LEVEL, match.level],
        names: [playerName, match.trainer.name],
      },
    )
    setRun({ ...run, team: order })
    setBattle(result)
    setPhase('battle')
  }

  const finishBattle = () => {
    if (!run || !battle) return
    const match = run.league[run.matchIndex]
    const won = battle.winner === 0
    const results = [...run.results, won]
    const summaries = [...run.summaries, summarizeBattle(battle, match.trainer.id, match.stage)]
    const next: Run = { ...run, results, summaries, matchIndex: run.matchIndex + 1 }
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
        return <Home stats={stats} name={name} onNameChange={changeName} onStart={startRun} />
      case 'draft':
        return run?.roll ? <Draft key={run.team.length} run={run} onPick={pickCreature} onReroll={reroll} /> : null
      case 'prep':
        return run ? <Prep run={run} onStart={startBattle} /> : null
      case 'battle':
        return run && battle ? (
          <BattleView result={battle} match={run.league[run.matchIndex]} playerName={playerName} onDone={finishBattle} />
        ) : null
      case 'end':
        return run ? (
          <RunEnd run={run} playerName={playerName} onAgain={() => startRun('random')} onHome={() => setPhase('home')} />
        ) : null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, run, battle, stats, name])

  return (
    <div className="app">
      <header className="topbar">
        <button className="logo" onClick={() => setPhase('home')}>
          Draft<span>League</span>
        </button>
        <div className="topbar-right">
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
        <AudioSettings />
        </div>
      </header>
      <main>{content}</main>
    </div>
  )
}
