import { useEffect, useMemo, useRef, useState } from 'react'
import type { BattleEvent, BattleMon, BattleResult, Side } from '../engine/battle'
import type { LeagueMatch } from '../engine/game'
import { HpBar, Sprite, StatusTag, TypeBadge } from './common'

interface ViewState {
  active: [number, number]
  hp: [number[], number[]]
  status: [(string | null)[], (string | null)[]]
  hitSide: Side | null
  attackerSide: Side | null
}

function viewAt(result: BattleResult, upTo: number): ViewState {
  const s: ViewState = {
    active: [0, 0],
    hp: [result.teams[0].map((m) => m.maxHp), result.teams[1].map((m) => m.maxHp)],
    status: [result.teams[0].map(() => null), result.teams[1].map(() => null)],
    hitSide: null,
    attackerSide: null,
  }
  for (let i = 0; i <= upTo && i < result.events.length; i++) {
    const e = result.events[i]
    const last = i === upTo
    switch (e.kind) {
      case 'switch':
        s.active[e.side] = e.slot
        break
      case 'damage':
        s.hp[e.side][e.slot] = e.hp
        if (last) s.hitSide = e.side
        break
      case 'heal':
        s.hp[e.side][e.slot] = e.hp
        break
      case 'status':
        s.status[e.side][e.slot] = e.status
        break
      case 'faint':
        s.hp[e.side][e.slot] = 0
        break
      case 'move':
        if (last) s.attackerSide = e.side
        break
    }
  }
  return s
}

const DELAY: Record<BattleEvent['kind'], number> = {
  turn: 250,
  switch: 900,
  move: 750,
  damage: 850,
  heal: 700,
  status: 800,
  stat: 700,
  faint: 1000,
  info: 750,
  end: 0,
}

function Combatant({ mon, hp, status, side, hit, attacking }: {
  mon: BattleMon
  hp: number
  status: string | null
  side: Side
  hit: boolean
  attacking: boolean
}) {
  return (
    <div className={`combatant side-${side} ${hit ? 'hit' : ''} ${attacking ? 'attacking' : ''} ${hp <= 0 ? 'fainted' : ''}`}>
      <div className="info-box">
        <div className="info-top">
          <b>{mon.name}</b>
          <span className="muted small">Lv{mon.level}</span>
          <StatusTag status={status} />
        </div>
        <div className="badges">
          {mon.types.map((t) => (
            <TypeBadge key={t} type={t} small />
          ))}
        </div>
        <HpBar hp={hp} max={mon.maxHp} />
      </div>
      <Sprite pokemon={mon.species} size={side === 1 ? 120 : 136} className={side === 0 ? 'flip' : ''} />
    </div>
  )
}

function TeamPips({ team, hp }: { team: BattleMon[]; hp: number[] }) {
  return (
    <div className="team-pips">
      {team.map((m, i) => (
        <span key={i} className={`ball ${hp[i] <= 0 ? 'out' : ''}`} title={m.name} />
      ))}
    </div>
  )
}

export function BattleView({ result, match, onDone }: { result: BattleResult; match: LeagueMatch; onDone: () => void }) {
  const [index, setIndex] = useState(0)
  const [speed, setSpeed] = useState(1)
  const logRef = useRef<HTMLDivElement>(null)
  const last = result.events.length - 1
  const finished = index >= last
  const view = useMemo(() => viewAt(result, index), [result, index])

  useEffect(() => {
    if (finished) return
    const e = result.events[index]
    const t = setTimeout(() => setIndex((i) => Math.min(last, i + 1)), DELAY[e.kind] / speed)
    return () => clearTimeout(t)
  }, [index, speed, finished, last, result])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [index])

  const shown = result.events.slice(0, index + 1)
  const won = result.winner === 0
  const [a0, a1] = view.active

  return (
    <div className="battle">
      <div className="arena">
        <div className="arena-row top">
          <TeamPips team={result.teams[1]} hp={view.hp[1]} />
          <Combatant
            mon={result.teams[1][a1]}
            hp={view.hp[1][a1]}
            status={view.status[1][a1]}
            side={1}
            hit={view.hitSide === 1}
            attacking={view.attackerSide === 1}
          />
        </div>
        <div className="arena-row bottom">
          <Combatant
            mon={result.teams[0][a0]}
            hp={view.hp[0][a0]}
            status={view.status[0][a0]}
            side={0}
            hit={view.hitSide === 0}
            attacking={view.attackerSide === 0}
          />
          <TeamPips team={result.teams[0]} hp={view.hp[0]} />
        </div>
        <div className="arena-trainer">
          <img src={match.trainer.sprite} alt="" width={40} height={40} />
          <span>
            {match.stage}: {match.trainer.title} {match.trainer.name}
          </span>
        </div>
      </div>

      <div className="battle-side">
        <div className="log" ref={logRef}>
          {shown.map((e, i) =>
            e.kind === 'turn' ? (
              <div key={i} className="log-turn">
                {e.text}
              </div>
            ) : (
              <div key={i} className={`log-line ${e.kind} ${e.kind === 'damage' && e.mult > 1 ? 'super' : ''} ${e.kind === 'end' ? (won ? 'win' : 'lose') : ''}`}>
                {e.text}
              </div>
            ),
          )}
        </div>
        <div className="battle-controls">
          {!finished ? (
            <>
              {[1, 2, 4].map((s) => (
                <button key={s} className={`btn ${speed === s ? 'active' : ''}`} onClick={() => setSpeed(s)}>
                  {s}×
                </button>
              ))}
              <button className="btn" onClick={() => setIndex(last)}>
                Skip ⏭
              </button>
            </>
          ) : (
            <button className={`btn big block ${won ? 'primary' : 'danger'}`} onClick={onDone}>
              {won ? 'Victory! Continue' : 'Defeat. See results'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
