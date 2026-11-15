import Image from 'next/image'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useState } from 'react'
import { LineupControls } from '../components/battle/LineupControls'
import { useBattleOrder } from '../components/battle/useBattleOrder'
import type { Run } from '../features/solo/run'
import { chart } from '../services/chart'
import { gameData } from '@draftmon/content'
import { displayName, typesOf } from '@draftmon/engine'
import { chooseMoveset } from '@draftmon/engine'
import { effectiveness } from '@draftmon/engine'
import { MoveChip } from '../components/pokemon/MoveChip'
import { Sprite } from '../components/pokemon/Sprite'
import { TypeBadge } from '../components/pokemon/TypeBadge'
import { useLanguage } from '../services/language'
import { LoreCard } from '../components/pokemon/LoreCard'
import { opponents } from '../components/pokemon/lore'

export function Prep({
  run,
  onStart,
}: {
  run: Run
  onStart: (order: string[]) => void
}) {
  const { t, stageLabel, trainerTitle } = useLanguage()
  const { order, move } = useBattleOrder(run.team)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const match = run.league[run.matchIndex]
  const foes = match.trainer.pokemon.map((m) =>
    gameData.pokemonByName.get(m.name)!,
  )

  /** How many foes this creature can hit super effectively, and how many threaten it. */
  const matchup = (name: string) => {
    const p = gameData.pokemonByName.get(name)!
    const moves = chooseMoveset(p, gameData).filter(
      (m) => m.damage_class.name !== 'status',
    )
    const hits = foes.filter((f) =>
      moves.some((m) => effectiveness(chart, m.type.name, typesOf(f)) > 1),
    ).length
    const threats = foes.filter((f) =>
      chooseMoveset(f, gameData).some(
        (m) =>
          m.damage_class.name !== 'status' &&
          effectiveness(chart, m.type.name, typesOf(p)) > 1,
      ),
    ).length
    return { hits, threats }
  }

  return (
    <div className="prep">
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1.5">
        {run.league.map((m, i) => {
          const state =
            i < run.results.length
              ? run.results[i]
                ? 'won'
                : 'lost'
              : i === run.matchIndex
                ? 'current'
                : 'upcoming'
          return (
            <div
              key={m.trainer.id}
              className={`bracket-step flex min-w-30 flex-1 items-center gap-2 rounded-xl border border-line bg-panel px-2.5 py-2 [&_img]:rounded-full [&.current]:border-accent [&.current]:shadow-[0_0_0_3px_#ffcb0522] [&.lost]:border-danger [&.upcoming_img]:[filter:grayscale(1)_brightness(.5)] [&.won]:border-[color:#18775266] ${state}`}
            >
              <Image
                src={m.trainer.sprite}
                alt=""
                width={36}
                height={36}
                unoptimized
                loading="eager"
              />
              <div>
                <div className="text-[.72rem] font-semibold tracking-[.12em] text-muted uppercase">
                  {stageLabel(m.stage)}
                </div>
                <div className="text-[.9rem] font-bold">
                  {i <= run.matchIndex ? m.trainer.name : '???'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="prep-grid grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-start gap-4 narrow-layout:[grid-template-columns:1fr]">
        <Card as="section">
          <div className="opponent-head mb-3 flex items-center gap-3.5 [&_img]:rounded-full">
            <LoreCard
              name={match.trainer.name}
              entry={opponents[match.trainer.id]}
              portrait={match.trainer.sprite}
            >
              <Image
                src={match.trainer.sprite}
                alt=""
                width={72}
                height={72}
                unoptimized
                loading="eager"
              />
            </LoreCard>
            <div>
              <div className="text-[.72rem] font-semibold tracking-[.12em] text-muted uppercase">
                {stageLabel(match.stage)} · {t('match', 'partida')}{' '}
                {run.matchIndex + 1}/{run.league.length}
              </div>
              <h2>
                {match.trainer.name} · {trainerTitle(match.trainer.title)}
              </h2>
              <p className="text-[.82rem] text-muted">
                {t('Lv.', 'Nv.')} {match.level} ·{' '}
                {t(
                  'Their lineup is shuffled every match',
                  'A ordem adversária muda a cada partida',
                )}
              </p>
            </div>
          </div>
          <div className="foe-list grid grid-cols-[1fr_1fr] gap-2 phone:[grid-template-columns:1fr]">
            {foes.map((f) => (
              <div
                key={f.name}
                className="flex items-center gap-2 rounded-[10px] bg-panel-muted px-2 py-1.5"
              >
                <Sprite pokemon={f} size={48} />
                <div>
                  <div className="mb-0.5 text-[.88rem] font-semibold">
                    {displayName(f.name)}
                  </div>
                  <div className="flex flex-wrap gap-[5px]">
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
          <p className="text-[.82rem] text-muted">
            {t(
              'Drag or use the arrows. The first Pokémon leads, and replacements follow this order.',
              'Arraste ou use as setas. O primeiro Pokémon abre a batalha e as substituições seguem esta ordem.',
            )}
          </p>
          <ol className="mx-0 mt-2 mb-3.5 grid list-none gap-2 p-0">
            {order.map((name, i) => {
              const p = gameData.pokemonByName.get(name)!
              const { hits, threats } = matchup(name)
              return (
                <li
                  key={name}
                  className={`order-item flex cursor-grab items-center gap-2.5 rounded-xl border border-line bg-panel-muted px-2.5 py-2 [&.dragging]:[opacity:.5] [&:first-child]:border-brand [&:first-child_.order-num]:text-brand ${dragIndex === i ? 'dragging' : ''}`}
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
                  <span className="order-num w-9.5 text-center text-[.8rem] font-extrabold text-muted">
                    {i === 0 ? t('Lead', 'Líder') : i + 1}
                  </span>
                  <Sprite pokemon={p} size={52} />
                  <div className="grid min-w-0 flex-1 gap-1">
                    <div className="flex flex-wrap items-center gap-1.5 font-bold">
                      {displayName(name)}
                      {typesOf(p).map((t) => (
                        <TypeBadge key={t} type={t} small />
                      ))}
                    </div>
                    <div className="moves compact mb-1.5 flex flex-wrap gap-[5px] [&.compact_.move-chip]:[padding:2px_6px] [&.compact_.move-chip]:text-[.68rem]">
                      {chooseMoveset(p, gameData).map((m) => (
                        <MoveChip key={m.name} move={m} />
                      ))}
                    </div>
                    <div className="matchup text-[.82rem] [&_.bad]:text-danger [&_.good]:text-success">
                      <span className="good">
                        {t('strong vs', 'vantagem contra')} {hits}
                      </span>{' '}
                      ·{' '}
                      <span className="bad">
                        {t('weak to', 'fraqueza contra')} {threats}
                      </span>
                    </div>
                  </div>
                  <LineupControls index={i} length={order.length} move={move} />
                </li>
              )
            })}
          </ol>
          <Button
            tone="primary"
            size="large"
            className="w-full"
            onClick={() => onStart(order)}
          >
            {t('Battle', 'Enfrentar')} {match.trainer.name}!
          </Button>
        </Card>
      </div>
    </div>
  )
}
