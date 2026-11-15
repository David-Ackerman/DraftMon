import { useEffect, useMemo, useRef, useState } from 'react'
import type { BattleEvent, BattleResult, Side } from '@draftmon/engine'
import type { SfxName } from '../../services/sound'
import { sound } from '../../services/sound'
import { viewAt } from './battleState'

function eventSound(e: BattleEvent, winner: Side): SfxName | null {
  switch (e.kind) {
    case 'damage':
      return e.source
        ? 'status'
        : e.crit
          ? 'crit'
          : e.mult > 1
            ? 'super'
            : e.mult < 1
              ? 'weak'
              : 'hit'
    case 'heal':
      return 'heal'
    case 'status':
      return e.status ? 'status' : null
    case 'stat':
      return e.change > 0 ? 'statUp' : 'statDown'
    case 'faint':
      return 'faint'
    case 'miss':
      return 'miss'
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
  const skipped = useRef(false)
  const last = result.events.length - 1
  const finished = index >= last
  const view = useMemo(() => viewAt(result, index), [result, index])
  const event = result.events[index]
  const next = result.events[index + 1]

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
    // after a skip only the final result is heard
    if (skipped.current && index < last) return
    const event = result.events[index]
    if (event.kind === 'switch') {
      sound.cry(result.teams[event.side][event.slot].species)
      return
    }
    if (event.kind === 'move') {
      sound.move(event.moveType, event.attacking ?? false)
      return
    }
    const name = eventSound(event, result.winner)
    if (name) sound.play(name)
  }, [index, last, result])

  function skip() {
    skipped.current = true
    setIndex(last)
  }

  return { index, speed, setSpeed, logRef, finished, view, event, next, skip }
}
