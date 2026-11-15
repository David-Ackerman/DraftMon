import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useLanguage } from '../services/language'
import { useEffect } from 'react'
import type { Run } from '../features/solo/run'
import { displayName, gameData } from '../engine/data'
import { mvpOf } from '../engine/summary'
import { Sprite } from '../components/pokemon/Sprite'
import { sound } from '../services/sound'
import { LoreCard } from '../components/pokemon/LoreCard'
import { opponents } from '../components/pokemon/lore'

export function RunEnd({
  run,
  playerName,
  onAgain,
  onHome,
}: {
  run: Run
  playerName: string
  onAgain: () => void
  onHome: () => void
}) {
  const { t, stageLabel, trainerTitle } = useLanguage()
  const wins = run.results.filter(Boolean).length
  const perfect = wins === run.league.length
  const lostTo = !perfect ? run.league[run.results.length - 1] : null

  useEffect(() => {
    if (perfect) sound.play('champion')
  }, [perfect])

  const downLabel = t('down', 'desmaiou')
  const totals = run.team.map((name) => ({
    name,
    kos: run.summaries.reduce((s, m) => s + (m.kos[name] ?? 0), 0),
    defeats: run.summaries.filter((m) => m.fainted.includes(name)).length,
  }))
  const runMvp = mvpOf(Object.fromEntries(totals.map((t) => [t.name, t.kos])))

  return (
    <div className="run-end max-w-240 my-6 mx-auto grid gap-4">
      <Card className="text-center">
        <div className="text-[.72rem] uppercase tracking-[.12em] text-muted font-semibold">{run.mode === 'daily' ? t('Daily challenge', 'Desafio diário') : t('Run complete', 'Campanha encerrada')} · {playerName}</div>
        <h1 className={perfect ? 'gold text-[#835300]' : ''}>
          {wins}–{perfect ? 0 : 1}
        </h1>
        <p className="text-[1.1rem] text-muted max-w-160">
          {perfect
            ? t('Perfect run! You are the League Champion.', 'Campanha perfeita! Você venceu a Liga.')
            : t(`You won ${wins} of ${run.league.length} matches. Eliminated by ${lostTo?.trainer.name} in ${lostTo?.stage}.`, `Você venceu ${wins} de ${run.league.length} partidas. Eliminação contra ${lostTo?.trainer.name} na fase ${stageLabel(lostTo?.stage ?? '')}.`)}
        </p>
        <div className="flex gap-3 flex-wrap justify-center my-3.5 mx-0">
          <Button tone="primary" size="large" onClick={onAgain}>
            {t('Build a new team', 'Montar nova equipe')}
          </Button>
          <Button size="large" onClick={onHome}>
            {t('Home', 'Início')}
          </Button>
        </div>
      </Card>

      <div className="summary-grid grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 items-start">
        <Card as="section">
          <h3>{t('Matches', 'Partidas')}</h3>
          <ol className="list-none m-0 p-0 grid gap-2">
            {run.summaries.map((m) => {
              const trainer = gameData.trainers.find((t) => t.id === m.trainerId)!
              const mvp = mvpOf(m.kos)
              return (
                <li key={m.trainerId} className={`match-row flex gap-2.5 items-center bg-panel-muted rounded-[10px] py-2 px-2.5 [border-left:4px_solid_var(--good)] ${m.won ? 'won' : 'lost'}`}>
                  <span className={`result-tag w-6.5 h-6.5 rounded-md grid place-items-center font-extrabold text-[.8rem] [flex-shrink:0] ${m.won ? 'won' : 'lost'}`}>{m.won ? t('W', 'V') : t('L', 'D')}</span>
                  <LoreCard name={trainer.name} entry={opponents[trainer.id]} portrait={trainer.sprite}>
                    <img src={trainer.sprite} alt="" width={36} height={36} />
                  </LoreCard>
                  <div className="grid gap-[1px] min-w-0">
                    <div className="text-[.72rem] uppercase tracking-[.12em] text-muted font-semibold">{stageLabel(m.stage)}</div>
                    <b>
                      {trainer.name} · {trainerTitle(trainer.title)}
                    </b>
                    <div className="text-muted text-[.82rem]">
                      {t(`${m.turns} turns · ${m.survivors}/${run.team.length} left standing`, `${m.turns} turnos · ${m.survivors}/${run.team.length} de pé`)}
                      {mvp && (
                        <>
                          {' '}
                          · MVP <b className="text-brand">{displayName(mvp[0])}</b> ({mvp[1]} KO{mvp[1] === 1 ? '' : 's'})
                        </>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </Card>

        <Card as="section">
          <h3>{t('Your team', 'Sua equipe')}</h3>
          <ul className="team-stats list-none m-0 p-0 grid gap-1.5">
            {totals.map((member) => {
              const p = gameData.pokemonByName.get(member.name)!
              const isMvp = runMvp?.[0] === member.name
              return (
                <li key={member.name} className={isMvp ? 'is-mvp' : ''}>
                  <Sprite pokemon={p} size={44} />
                  <b>{displayName(member.name)}</b>
                  {isMvp && <span className="bg-accent text-accent-ink text-[.65rem] font-extrabold py-[1px] px-[7px] rounded-full uppercase">{t('Run MVP', 'Destaque da campanha')}</span>}
                  <span className="team-stat text-[.78rem] font-bold tabular-nums good">{member.kos} KO</span>
                  <span className="team-stat text-[.78rem] font-bold tabular-nums bad">{member.defeats}× {downLabel}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </div>
  )
}
