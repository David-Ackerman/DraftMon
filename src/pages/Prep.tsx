import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useState } from 'react'
import { LineupControls } from '../components/battle/LineupControls'
import { useBattleOrder } from '../components/battle/useBattleOrder'
import type { Run } from '../features/solo/run'
import { chart } from '../engine/chart'
import { displayName, gameData, typesOf } from '../engine/data'
import { chooseMoveset } from '../engine/battle'
import { effectiveness } from '../engine/typeChart'
import { MoveChip } from '../components/pokemon/MoveChip'
import { Sprite } from '../components/pokemon/Sprite'
import { TypeBadge } from '../components/pokemon/TypeBadge'
import { useLanguage } from '../services/language'
import { LoreCard } from '../components/pokemon/LoreCard'
import { opponents } from '../components/pokemon/lore'

export function Prep({ run, onStart }: { run: Run; onStart: (order: string[]) => void }) {
  const { t, stageLabel, trainerTitle } = useLanguage()
  const { order, move } = useBattleOrder(run.team)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const match = run.league[run.matchIndex]
  const foes = match.trainer.pokemon.map((m) => gameData.pokemonByName.get(m.name)!)

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
      <div className="flex gap-2 overflow-x-auto pb-1.5 mb-4">
        {run.league.map((m, i) => {
          const state = i < run.results.length ? (run.results[i] ? 'won' : 'lost') : i === run.matchIndex ? 'current' : 'upcoming'
          return (
            <div key={m.trainer.id} className={`bracket-step flex-1 min-w-30 flex gap-2 items-center bg-panel border border-line rounded-xl py-2 px-2.5 ${state}`}>
              <img src={m.trainer.sprite} alt="" width={36} height={36} />
              <div>
                <div className="text-[.72rem] uppercase tracking-[.12em] text-muted font-semibold">{stageLabel(m.stage)}</div>
                <div className="font-bold text-[.9rem]">{i <= run.matchIndex ? m.trainer.name : '???'}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="prep-grid grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-4 items-start">
        <Card as="section">
          <div className="opponent-head flex gap-3.5 items-center mb-3">
            <LoreCard name={match.trainer.name} entry={opponents[match.trainer.id]} portrait={match.trainer.sprite}>
              <img src={match.trainer.sprite} alt="" width={72} height={72} />
            </LoreCard>
            <div>
              <div className="text-[.72rem] uppercase tracking-[.12em] text-muted font-semibold">
                {stageLabel(match.stage)} · {t('match', 'partida')} {run.matchIndex + 1}/{run.league.length}
              </div>
              <h2>
                {match.trainer.name} · {trainerTitle(match.trainer.title)}
              </h2>
              <p className="text-muted text-[.82rem]">{t('Lv.', 'Nv.')} {match.level} · {t('Their lineup is shuffled every match', 'A ordem adversária muda a cada partida')}</p>
            </div>
          </div>
          <div className="foe-list grid grid-cols-[1fr_1fr] gap-2">
            {foes.map((f) => (
              <div key={f.name} className="flex gap-2 items-center bg-panel-muted rounded-[10px] py-1.5 px-2">
                <Sprite pokemon={f} size={48} />
                <div>
                  <div className="font-semibold text-[.88rem] mb-0.5">{displayName(f.name)}</div>
                  <div className="flex gap-[5px] flex-wrap">
                    {typesOf(f).map((t) => (
                      <TypeBadge key={t} type={t} small />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card as="section">
          <h3>{t('Your lineup', 'Sua formação')}</h3>
          <p className="text-muted text-[.82rem]">{t('Drag or use the arrows. The first Pokémon leads, and replacements follow this order.', 'Arraste ou use as setas. O primeiro Pokémon abre a batalha e as substituições seguem esta ordem.')}</p>
          <ol className="list-none p-0 mt-2 mx-0 mb-3.5 grid gap-2">
            {order.map((name, i) => {
              const p = gameData.pokemonByName.get(name)!
              const { hits, threats } = matchup(name)
              return (
                <li
                  key={name}
                  className={`order-item flex gap-2.5 items-center bg-panel-muted border border-line rounded-xl py-2 px-2.5 cursor-grab ${dragIndex === i ? 'dragging' : ''}`}
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
                  <span className="order-num w-9.5 text-center font-extrabold text-muted text-[.8rem]">{i === 0 ? t('Lead', 'Líder') : i + 1}</span>
                  <Sprite pokemon={p} size={52} />
                  <div className="flex-1 min-w-0 grid gap-1">
                    <div className="flex items-center gap-1.5 font-bold flex-wrap">
                      {displayName(name)}
                      {typesOf(p).map((t) => (
                        <TypeBadge key={t} type={t} small />
                      ))}
                    </div>
                    <div className="moves flex flex-wrap gap-[5px] mb-1.5 compact">
                      {chooseMoveset(p, gameData).map((m) => (
                        <MoveChip key={m.name} move={m} />
                      ))}
                    </div>
                    <div className="matchup text-[.82rem]">
                      <span className="good">{t('strong vs', 'vantagem contra')} {hits}</span> · <span className="bad">{t('weak to', 'fraqueza contra')} {threats}</span>
                    </div>
                  </div>
                  <LineupControls index={i} length={order.length} move={move} />
                </li>
              )
            })}
          </ol>
          <Button tone="primary" size="large" className="w-full" onClick={() => onStart(order)}>
            {t('Battle', 'Enfrentar')} {match.trainer.name}!
          </Button>
        </Card>
      </div>
    </div>
  )
}
