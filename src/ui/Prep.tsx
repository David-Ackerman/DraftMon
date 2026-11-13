import { useState } from 'react'
import type { Run } from '../App'
import { chart } from './chart'
import { displayName, gameData, typesOf } from '../engine/data'
import { chooseMoveset } from '../engine/battle'
import { effectiveness } from '../engine/typeChart'
import { MoveChip, Sprite, TypeBadge } from './common'

export function Prep({ run, onStart }: { run: Run; onStart: (order: string[]) => void }) {
  const [order, setOrder] = useState(run.team)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const match = run.league[run.matchIndex]
  const foes = match.trainer.pokemon.map((m) => gameData.pokemonByName.get(m.name)!)

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return
    const next = [...order]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setOrder(next)
  }

  /** How many foes this creature can hit super effectively, and how many threaten it. */
  const matchup = (name: string) => {
    const p = gameData.pokemonByName.get(name)!
    const moves = chooseMoveset(p, gameData).filter((m) => m.damage_class.name !== 'status')
    const hits = foes.filter((f) => moves.some((m) => effectiveness(chart, m.type.name, typesOf(f)) > 1)).length
    const threats = foes.filter((f) =>
      chooseMoveset(f, gameData).some((m) => m.damage_class.name !== 'status' && effectiveness(chart, m.type.name, typesOf(p)) > 1),
    ).length
    return { hits, threats }
  }

  return (
    <div className="prep">
      <div className="bracket">
        {run.league.map((m, i) => {
          const state = i < run.results.length ? (run.results[i] ? 'won' : 'lost') : i === run.matchIndex ? 'current' : 'upcoming'
          return (
            <div key={m.trainer.id} className={`bracket-step ${state}`}>
              <img src={m.trainer.sprite} alt="" width={36} height={36} />
              <div>
                <div className="eyebrow">{m.stage}</div>
                <div className="bracket-name">{i <= run.matchIndex ? m.trainer.name : '???'}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="prep-grid">
        <section className="card">
          <div className="opponent-head">
            <img src={match.trainer.sprite} alt="" width={72} height={72} />
            <div>
              <div className="eyebrow">
                {match.stage} · match {run.matchIndex + 1} of {run.league.length}
              </div>
              <h2>
                {match.trainer.title} {match.trainer.name}
              </h2>
              <p className="muted small">Lv {match.level} · their order is shuffled every match</p>
            </div>
          </div>
          <div className="foe-list">
            {foes.map((f) => (
              <div key={f.name} className="foe">
                <Sprite pokemon={f} size={48} />
                <div>
                  <div className="foe-name">{displayName(f.name)}</div>
                  <div className="badges">
                    {typesOf(f).map((t) => (
                      <TypeBadge key={t} type={t} small />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>Your order</h3>
          <p className="muted small">Drag or use the arrows. Slot 1 leads; fainted creatures are replaced in order.</p>
          <ol className="order-list">
            {order.map((name, i) => {
              const p = gameData.pokemonByName.get(name)!
              const { hits, threats } = matchup(name)
              return (
                <li
                  key={name}
                  className={`order-item ${dragIndex === i ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (dragIndex !== null && dragIndex !== i) {
                      move(dragIndex, i)
                      setDragIndex(i)
                    }
                  }}
                  onDragEnd={() => setDragIndex(null)}
                >
                  <span className="order-num">{i === 0 ? 'Lead' : i + 1}</span>
                  <Sprite pokemon={p} size={52} />
                  <div className="order-info">
                    <div className="order-name">
                      {displayName(name)}
                      {typesOf(p).map((t) => (
                        <TypeBadge key={t} type={t} small />
                      ))}
                    </div>
                    <div className="moves compact">
                      {chooseMoveset(p, gameData).map((m) => (
                        <MoveChip key={m.name} move={m} />
                      ))}
                    </div>
                    <div className="matchup small">
                      <span className="good">strong vs {hits}</span> · <span className="bad">weak to {threats}</span>
                    </div>
                  </div>
                  <div className="order-arrows">
                    <button className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}>
                      ▲
                    </button>
                    <button className="icon-btn" aria-label="Move down" disabled={i === order.length - 1} onClick={() => move(i, i + 1)}>
                      ▼
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
          <button className="btn primary big block" onClick={() => onStart(order)}>
            Battle {match.trainer.name}!
          </button>
        </section>
      </div>
    </div>
  )
}
