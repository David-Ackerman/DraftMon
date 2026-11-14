import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Run } from '../App'
import { displayName, gameData, regionDescription, regionLabel } from '../engine/data'
import type { RerollMode } from '../engine/game'
import { OPTIONS_PER_ROLL, TEAM_SIZE } from '../engine/game'
import { CreatureCard, Sprite, TypeBadge } from './common'
import { sound } from './sound'

type Stage = 'ready' | 'spinning' | 'shown'

/** A slot-machine reel: cycles through items, slowing down until it lands on `final`. */
function Reel({
  items,
  final,
  spinning,
  duration,
  onStop,
  render,
  hidden,
}: {
  items: string[]
  final: string
  spinning: boolean
  duration: number
  onStop: () => void
  render: (item: string) => ReactNode
  hidden?: boolean
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
        sound.play('land')
        onStopRef.current()
        return
      }
      i = (i + 1) % items.length
      if (items[i] === final && elapsed > duration * 0.7) i = (i + 1) % items.length
      setShown(items[i])
      sound.play('tick', i % 6)
      // ease out: ticks get slower towards the end
      delay = 50 + (elapsed / duration) ** 2 * 280
      timer = setTimeout(tick, delay)
    }
    timer = setTimeout(tick, delay)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [spinning, final, duration, items])

  return (
    <span className={`reel ${spinning && !landed ? 'spinning' : ''} ${landed ? 'landed' : ''}`}>
      {hidden ? (
        <span className="reel-item mystery">???</span>
      ) : (
        <span key={shown} className="reel-item">
          {render(shown)}
        </span>
      )}
    </span>
  )
}

function Dice({ rolling }: { rolling: boolean }) {
  return (
    <svg className={`dice ${rolling ? 'rolling' : ''}`} viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
      <rect x="3" y="3" width="34" height="34" rx="8" fill="#fff" stroke="#1d1d1d" strokeWidth="2.5" />
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

export function Draft({
  run,
  onPick,
  onReroll,
}: {
  run: Run
  onPick: (name: string) => void
  onReroll: (mode: RerollMode) => void
}) {
  const roll = run.roll!
  const [stage, setStage] = useState<Stage>('ready')
  const [spin, setSpin] = useState({ region: false, type: false })
  const pending = useRef(0)
  const region = gameData.regions.find((r) => r.name === roll.region)
  const regionNames = useMemo(() => gameData.regions.map((r) => r.name), [])
  const typeNames = useMemo(() => gameData.types.map((t) => t.name), [])
  const canReroll = stage === 'shown' && run.rerollsLeft > 0

  const startSpin = (parts: { region: boolean; type: boolean }) => {
    pending.current = Number(parts.region) + Number(parts.type)
    setSpin(parts)
    setStage('spinning')
  }

  const reelStopped = () => {
    pending.current--
    if (pending.current <= 0) {
      setSpin({ region: false, type: false })
      setStage('shown')
      sound.play('reveal')
    }
  }

  const reroll = (mode: RerollMode) => {
    sound.play('reroll')
    onReroll(mode)
    startSpin({ region: mode !== 'type', type: mode !== 'region' })
  }

  const hidden = stage === 'ready'

  return (
    <div className="draft">
      <div className="team-strip">
        {Array.from({ length: TEAM_SIZE }, (_, i) => {
          const p = run.team[i] ? gameData.pokemonByName.get(run.team[i]) : undefined
          return (
            <div key={i} className={`slot ${p ? 'filled' : ''} ${i === run.team.length ? 'next' : ''}`} title={p ? displayName(p.name) : 'Empty'}>
              {p ? <Sprite pokemon={p} size={52} /> : <span>{i + 1}</span>}
            </div>
          )
        })}
      </div>

      <div className="roll-header">
        <div className="roll-title">
          <div className="eyebrow">
            Pick {run.team.length + 1} of {TEAM_SIZE}
          </div>
          <h2 className="reels">
            <Reel
              items={regionNames}
              final={roll.region}
              spinning={spin.region}
              duration={1500}
              onStop={reelStopped}
              hidden={hidden}
              render={(r) => {
                const reg = gameData.regions.find((x) => x.name === r)
                return reg ? regionLabel(reg) : displayName(r)
              }}
            />
            <span className="dot">·</span>
            <Reel
              items={typeNames}
              final={roll.type}
              spinning={spin.type}
              duration={2100}
              onStop={reelStopped}
              hidden={hidden}
              render={(t) => <TypeBadge type={t} tip={false} />}
            />
          </h2>
          <p className="muted region-desc">
            {stage === 'shown' && region ? regionDescription(region) : stage === 'ready' ? 'Roll the dice to draw a region and a type.' : 'Rolling…'}
          </p>
        </div>
        <div className="reroll-box">
          <div className="reroll-count">
            {run.rerollsLeft} reroll{run.rerollsLeft === 1 ? '' : 's'} left
          </div>
          <div className="reroll-buttons">
            <button className="btn" disabled={!canReroll} onClick={() => reroll('type')} title="Keep the region, roll a new type">
              ↻ Type
            </button>
            <button className="btn" disabled={!canReroll} onClick={() => reroll('region')} title="Keep the type, roll a new region">
              ↻ Region
            </button>
            <button className="btn" disabled={!canReroll} onClick={() => reroll('both')} title="Roll a new region and type">
              ↻ Both
            </button>
          </div>
        </div>
      </div>

      {stage !== 'shown' ? (
        <div className="roll-stage">
          <div className="options">
            {Array.from({ length: OPTIONS_PER_ROLL }, (_, i) => (
              <div key={i} className={`card card-back ${stage === 'spinning' ? 'shuffling' : ''}`} style={{ animationDelay: `${i * 0.12}s` }}>
                <span>?</span>
              </div>
            ))}
          </div>
          {stage === 'ready' && (
            <button
              className="btn primary roll-btn"
              autoFocus
              onClick={() => {
                sound.play('reroll')
                startSpin({ region: true, type: true })
              }}
            >
              <Dice rolling={false} /> Roll
            </button>
          )}
          {stage === 'spinning' && (
            <div className="roll-btn rolling-label" aria-live="polite">
              <Dice rolling /> Rolling…
            </div>
          )}
        </div>
      ) : (
        <div className="options reveal">
          {roll.options.map((name, i) => {
            const p = gameData.pokemonByName.get(name)!
            return (
              <div key={name} className="reveal-card" style={{ animationDelay: `${i * 0.12}s` }}>
                <CreatureCard pokemon={p} offTheme={i >= roll.matches} onPick={() => onPick(name)} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
