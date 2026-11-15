import { useRef, useState } from 'react'
import type { BattleResult } from '@draftmon/engine'
import { simulateBattle } from '@draftmon/engine'
import { chart } from '../../services/chart'
import { gameData } from '@draftmon/content'
import {
  createLeague,
  PLAYER_LEVEL,
  REROLLS_PER_RUN,
  rollOptions,
  TEAM_SIZE,
  trainerTeamForMatch,
} from '@draftmon/engine'
import type { RerollMode } from '@draftmon/engine'
import { battleSpecies } from '@draftmon/engine'
import { createRng, seedFromString } from '@draftmon/engine'
import { summarizeBattle } from '@draftmon/engine'
import { recordPokemonUsage } from '../../services/pokemonUsage'
import type { UsageIdentity } from '../../services/pokemonUsage'
import { loadStats, recordRun } from '../../services/storage'
import type { Run } from './run'

const today = () => new Date().toISOString().slice(0, 10)

export function useSoloRun(
  playerName: string,
  identity: UsageIdentity,
  setPhase: (phase: 'draft' | 'prep' | 'battle' | 'end') => void,
) {
  const [run, setRun] = useState<Run | null>(null)
  const [battle, setBattle] = useState<BattleResult | null>(null)
  const [stats, setStats] = useState(loadStats)
  const rngRef = useRef(createRng(1))
  const pendingUsage = useRef<{ identity: UsageIdentity; id: string } | null>(
    null,
  )

  const startRun = (mode: 'random' | 'daily') => {
    const seed =
      mode === 'daily'
        ? seedFromString(`daily-${today()}`)
        : (Math.random() * 2 ** 32) >>> 0
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
    const done = team.length >= TEAM_SIZE
    setRun({
      ...run,
      team,
      roll: done ? null : rollOptions(gameData, rngRef.current, team),
    })
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
    const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('')
    pendingUsage.current = { id, identity: identity }
    setRun({ ...run, team: order })
    setBattle(result)
    setPhase('battle')
  }

  const recordBattleUsage = () => {
    const entry = pendingUsage.current
    if (!battle || !entry) return
    pendingUsage.current = null
    recordPokemonUsage(entry.identity, {
      id: entry.id,
      species: battleSpecies(battle, 0),
    })
  }

  const finishBattle = () => {
    if (!run || !battle) return
    recordBattleUsage()
    const match = run.league[run.matchIndex]
    const won = battle.winner === 0
    const results = [...run.results, won]
    const summaries = [
      ...run.summaries,
      summarizeBattle(battle, match.trainer.id, match.stage),
    ]
    const next: Run = {
      ...run,
      results,
      summaries,
      matchIndex: run.matchIndex + 1,
    }
    setRun(next)
    setBattle(null)
    if (!won || next.matchIndex >= run.league.length) {
      setStats(
        recordRun(
          results.filter(Boolean).length,
          results.length === run.league.length && won,
          run.mode,
          today(),
        ),
      )
      setPhase('end')
    } else setPhase('prep')
  }

  return {
    run,
    battle,
    stats,
    startRun,
    pickCreature,
    reroll,
    startBattle,
    recordBattleUsage,
    finishBattle,
  }
}
