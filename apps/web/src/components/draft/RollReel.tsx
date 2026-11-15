import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { sound } from '../../services/sound'

/** A slot-machine reel: cycles through items, slowing down until it lands on `final`. */
export function Reel({
  items,
  final,
  spinning,
  duration,
  onStop,
  render,
  hidden,
  audible = true,
}: {
  items: string[]
  final: string
  spinning: boolean
  duration: number
  onStop: () => void
  render: (item: string) => ReactNode
  hidden?: boolean
  audible?: boolean
}) {
  const [shown, setShown] = useState(final)
  const [landed, setLanded] = useState(false)
  const onStopRef = useRef(onStop)
  onStopRef.current = onStop

  useEffect(() => {
    if (!spinning) {
      setShown(final)
      return
    }
    setLanded(false)
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    let elapsed = 0
    let i = Math.floor(Math.random() * items.length)
    let delay = 50
    const tick = () => {
      if (cancelled) return
      elapsed += delay
      if (elapsed >= duration) {
        setShown(final)
        setLanded(true)
        onStopRef.current()
        return
      }
      i = (i + 1) % items.length
      if (items[i] === final && elapsed > duration * 0.7)
        i = (i + 1) % items.length
      setShown(items[i])
      if (audible) sound.play('tick')
      // ease out: ticks get slower towards the end
      delay = 50 + (elapsed / duration) ** 2 * 280
      timer = setTimeout(tick, delay)
    }
    timer = setTimeout(tick, delay)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [spinning, final, duration, items, audible])

  return (
    <span
      className={`reel inline-flex min-w-10 items-center overflow-hidden rounded-[10px] px-1 py-0.5 [transition:background_.2s,box-shadow_.2s] [&.landed]:animate-land motion-reduce:[&.landed]:[animation:none]! [&.landed_.reel-item]:[animation:none] [&.spinning]:bg-[#e1ebff] [&.spinning]:shadow-[inset_0_0_0_1px_var(--line)] dark:[&.spinning]:bg-panel-muted ${spinning && !landed ? 'spinning' : ''} ${landed ? 'landed' : ''}`}
    >
      {hidden ? (
        <span className="reel-item mystery inline-flex animate-reel-in items-center motion-reduce:[animation:none]! [&.mystery]:[letter-spacing:.1em] [&.mystery]:text-muted">
          ???
        </span>
      ) : (
        <span
          key={shown}
          className="reel-item inline-flex animate-reel-in items-center motion-reduce:[animation:none]! [&.mystery]:[letter-spacing:.1em] [&.mystery]:text-muted"
        >
          {render(shown)}
        </span>
      )}
    </span>
  )
}

export function Dice({ rolling }: { rolling: boolean }) {
  return (
    <svg
      className={`dice [flex-shrink:0] motion-reduce:[animation:none]! [&.rolling]:animate-dice-roll ${rolling ? 'rolling' : ''}`}
      viewBox="0 0 40 40"
      width="34"
      height="34"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="34"
        height="34"
        rx="8"
        fill="#fff"
        stroke="#1d1d1d"
        strokeWidth="2.5"
      />
      {[
        [12, 12],
        [28, 12],
        [20, 20],
        [12, 28],
        [28, 28],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.4" fill="#1d1d1d" />
      ))}
    </svg>
  )
}
