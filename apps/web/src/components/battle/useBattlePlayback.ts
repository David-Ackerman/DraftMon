import { useEffect, useMemo, useRef, useState } from 'react'
import type { BattleEvent, BattleResult, Side } from '@draftmon/engine'
import type { BattleCue } from '../../services/sound'
import { sound } from '../../services/sound'
import { viewAt } from './battleState'

function eventSound(event: BattleEvent, winner: Side): BattleCue | null {
  switch (event.kind) {
    case 'damage':
      return event.source || event.amount <= 0 ? null : 'hit'
    case 'faint':
      return 'faint'
    case 'end':
      return winner === 0 ? 'win' : 'lose'
    default:
      return null
  }
}

export const DELAY: Record<BattleEvent['kind'], number> = {
  turn: 200,
  switch: 1000,
  move: 700,
  miss: 500,
  damage: 900,
  heal: 700,
  status: 800,
  stat: 650,
  faint: 1000,
  info: 700,
  end: 0,
}

export function useBattlePlayback(
  result: BattleResult,
  onComplete?: () => void,
) {
  const [index, setIndex] = useState(0)
  const [speed, setSpeed] = useState(1)
  const logRef = useRef<HTMLDivElement>(null)
  const last = result.events.length - 1
  const finished = index >= last
  const view = useMemo(() => viewAt(result, index), [result, index])
  const event = result.events[index]
  const next = result.events[index + 1]
  const cue = eventSound(event, result.winner)

  useEffect(() => {
    sound.setBattleActive(true)
    sound.preload('hit')
    sound.preload('faint')
    return () => sound.setBattleActive(false)
  }, [])

  useEffect(() => {
    if (finished) onComplete?.()
  }, [finished, onComplete])

  useEffect(() => {
    if (finished) return
    const e = result.events[index]
    const t = setTimeout(
      () => setIndex((i) => Math.min(last, i + 1)),
      DELAY[e.kind] / speed,
    )
    return () => clearTimeout(t)
  }, [index, speed, finished, last, result])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
    if (cue) return sound.playBattle(cue)
  }, [cue, index, result])

  function skip() {
    setIndex(last)
  }

  return { index, speed, setSpeed, logRef, finished, view, event, next, skip }
}
