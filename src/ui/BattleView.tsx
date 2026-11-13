import { useEffect, useMemo, useRef, useState } from 'react'
import type { BattleEvent, BattleMon, BattleResult, Side } from '../engine/battle'
import { STAT_LABELS } from '../engine/data'
import type { StatName } from '../engine/data'
import type { Stages, ViewState } from './battleState'
import { viewAt } from './battleState'
import type { LeagueMatch } from '../engine/game'
import { HpBar, Sprite, TypeBadge } from './common'

const DELAY: Record<BattleEvent['kind'], number> = {
  turn: 200,
  switch: 1000,
  move: 700,
  damage: 900,
  heal: 700,
  status: 800,
  stat: 650,
  faint: 1000,
  info: 700,
  end: 0,
}

const STATUS_BADGE: Record<string, [string, string]> = {
  burn: ['Burned', '#EE8130'],
  poison: ['Poisoned', '#A33EA1'],
  paralysis: ['Paralyzed', '#c9a400'],
  sleep: ['Asleep', '#7f8c9a'],
  freeze: ['Frozen', '#4fb3d9'],
}

function EffectBadges({ status, stages }: { status: string | null; stages: Stages }) {
  const statBadges = (Object.entries(stages) as [StatName, number][]).filter(([, v]) => v !== 0)
  if (!status && statBadges.length === 0) return <div className="effects empty">No effects</div>
  return (
    <div className="effects">
      {status && (
        <span className="effect status" style={{ background: STATUS_BADGE[status]?.[1] }}>
          {STATUS_BADGE[status]?.[0] ?? status}
        </span>
      )}
      {statBadges.map(([stat, v]) => (
        <span key={stat} className={`effect ${v > 0 ? 'up' : 'down'}`}>
          {STAT_LABELS[stat]} {v > 0 ? `+${v}` : `−${-v}`}
        </span>
      ))}
    </div>
  )
}

function BattleCard({ owner, team, view, side }: { owner: string; team: BattleMon[]; view: ViewState; side: Side }) {
  const slot = view.active[side]
  const mon = team[slot]
  const hp = view.hp[side][slot]
  return (
    <div className={`battle-card-wrap side-${side}`}>
      <div className="eyebrow owner">{owner}</div>
      {/* keyed by slot so a newly chosen creature's card appears fresh */}
      <div key={slot} className={`card battle-card ${hp <= 0 ? 'defeated' : ''}`}>
        <div className="battle-card-top">
          <Sprite pokemon={mon.species} size={88} />
          <div className="battle-card-info">
            <div className="battle-card-name">
              <b>{mon.name}</b>
              <span className="muted small">Lv{mon.level}</span>
            </div>
            <div className="badges">
              {mon.types.map((t) => (
                <TypeBadge key={t} type={t} small />
              ))}
            </div>
            <HpBar hp={hp} max={mon.maxHp} />
          </div>
        </div>
        <EffectBadges status={view.status[side][slot]} stages={view.stages[side][slot]} />
        {hp <= 0 && <div className="defeated-tag">Defeated</div>}
      </div>
      <div className="bench">
        {team.map((m, i) => (
          <span
            key={i}
            className={`bench-mon ${i === slot ? 'active' : ''} ${view.hp[side][i] <= 0 ? 'out' : ''}`}
            title={`${m.name} ${Math.max(0, view.hp[side][i])}/${m.maxHp}`}
          >
            <Sprite pokemon={m.species} size={34} />
          </span>
        ))}
      </div>
    </div>
  )
}

const eventSide = (e: BattleEvent): Side | undefined => ('side' in e ? e.side : undefined)

export function BattleView({
  result,
  match,
  playerName,
  onDone,
}: {
  result: BattleResult
  match: LeagueMatch
  playerName: string
  onDone: () => void
}) {
  const [index, setIndex] = useState(0)
  const [speed, setSpeed] = useState(1)
  const logRef = useRef<HTMLDivElement>(null)
  const last = result.events.length - 1
  const finished = index >= last
  const view = useMemo(() => viewAt(result, index), [result, index])
  const won = result.winner === 0

  useEffect(() => {
    if (finished) return
    const e = result.events[index]
    const t = setTimeout(() => setIndex((i) => Math.min(last, i + 1)), DELAY[e.kind] / speed)
    return () => clearTimeout(t)
  }, [index, speed, finished, last, result])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [index])

  return (
    <div className="battle">
      <div className="battle-head">
        <div className="eyebrow">
          {match.stage} · {match.trainer.title}
        </div>
        <h2>
          <span className="name-0">{playerName}</span> <span className="vs">vs</span>{' '}
          <span className="name-1">{match.trainer.name}</span>
        </h2>
      </div>

      <div className="battle-board">
        <BattleCard owner={playerName} team={result.teams[0]} view={view} side={0} />
        <BattleCard owner={match.trainer.name} team={result.teams[1]} view={view} side={1} />
      </div>

      <div className="log" ref={logRef} aria-live="polite">
        {result.events.slice(0, index + 1).map((e, i) => {
          if (e.kind === 'turn') return <div key={i} className="log-turn">{e.text}</div>
          const side = eventSide(e)
          const cls = [
            'log-line',
            e.kind,
            side !== undefined ? `side-${side}` : '',
            e.kind === 'damage' && e.mult > 1 ? 'super' : '',
            e.kind === 'end' ? (won ? 'win' : 'lose') : '',
          ].join(' ')
          return <div key={i} className={cls}>{e.text}</div>
        })}
      </div>

      <div className="battle-controls">
        {!finished ? (
          <>
            <span className="muted small">Speed</span>
            {[1, 2, 4].map((s) => (
              <button key={s} className={`btn ${speed === s ? 'active' : ''}`} onClick={() => setSpeed(s)}>
                {s}×
              </button>
            ))}
            <button className="btn" onClick={() => setIndex(last)}>
              Skip to result
            </button>
          </>
        ) : (
          <button className={`btn big block ${won ? 'primary' : 'danger'}`} onClick={onDone}>
            {won ? 'Victory! Continue' : 'Defeat. See results'}
          </button>
        )}
      </div>
    </div>
  )
}
