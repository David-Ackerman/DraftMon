import Image from 'next/image'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useLanguage } from '../services/language'
import { useEffect } from 'react'
import type { Run } from '../features/solo/run'
import { gameData } from '@draftmon/content'
import { displayName } from '@draftmon/engine'
import { mvpOf } from '@draftmon/engine'
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
    <div className="run-end mx-auto my-6 grid max-w-240 gap-4 [&_h1]:[margin:8px_0] [&_h1]:text-[5rem]">
      <Card className="text-center">
        <div className="text-[.72rem] font-black tracking-[.1em] text-muted uppercase">
          {run.mode === 'daily'
            ? t('Daily challenge', 'Desafio diário')
            : t('Run complete', 'Campanha encerrada')}{' '}
          · {playerName}
        </div>
        <h1
          className={
            perfect ? 'gold text-[#835300] dark:text-[color:#ffd98e]' : ''
          }
        >
          {wins}–{perfect ? 0 : 1}
        </h1>
        <p className="max-w-160 text-[1.1rem] text-muted">
          {perfect
            ? t(
                'Perfect run! You are the League Champion.',
                'Campanha perfeita! Você venceu a Liga.',
              )
            : t(
                `You won ${wins} of ${run.league.length} matches. Eliminated by ${lostTo?.trainer.name} in ${lostTo?.stage}.`,
                `Você venceu ${wins} de ${run.league.length} partidas. Eliminação contra ${lostTo?.trainer.name} na fase ${stageLabel(lostTo?.stage ?? '')}.`,
              )}
        </p>
        <div className="mx-0 my-3.5 flex flex-wrap justify-center gap-3">
          <Button tone="primary" size="large" onClick={onAgain}>
            {t('Build a new team', 'Montar nova equipe')}
          </Button>
          <Button size="large" onClick={onHome}>
            {t('Home', 'Início')}
          </Button>
        </div>
      </Card>

      <div className="summary-grid grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start gap-4 narrow-layout:[grid-template-columns:1fr]">
        <Card as="section">
          <h3>{t('Matches', 'Partidas')}</h3>
          <ol className="m-0 grid list-none gap-2 p-0">
            {run.summaries.map((m) => {
              const trainer = gameData.trainers.find(
                (t) => t.id === m.trainerId,
              )!
              const mvp = mvpOf(m.kos)
              return (
                <li
                  key={m.trainerId}
                  className={`match-row flex items-center gap-2.5 rounded-xl border-2 border-outline bg-panel-muted px-2.5 py-2 [border-left:4px_solid_var(--good)] [&_img]:rounded-full [&.lost]:[border-left-color:var(--bad)] ${m.won ? 'won' : 'lost'}`}
                >
                  <span
                    className={`result-tag grid h-7 w-7 [flex-shrink:0] place-items-center rounded-lg border-2 border-outline font-pixel text-[.6rem] dark:text-accent-ink [&.lost]:bg-danger [&.lost]:text-white [&.won]:bg-success [&.won]:text-white ${m.won ? 'won' : 'lost'}`}
                  >
                    {m.won ? t('W', 'V') : t('L', 'D')}
                  </span>
                  <LoreCard
                    name={trainer.name}
                    entry={opponents[trainer.id]}
                    portrait={trainer.sprite}
                  >
                    <Image
                      src={trainer.sprite}
                      alt=""
                      width={36}
                      height={36}
                      unoptimized
                      loading="eager"
                    />
                  </LoreCard>
                  <div className="grid min-w-0 gap-[1px]">
                    <div className="text-[.72rem] font-black tracking-[.1em] text-muted uppercase">
                      {stageLabel(m.stage)}
                    </div>
                    <b>
                      {trainer.name} · {trainerTitle(trainer.title)}
                    </b>
                    <div className="text-[.82rem] text-muted">
                      {t(
                        `${m.turns} turns · ${m.survivors}/${run.team.length} left standing`,
                        `${m.turns} turnos · ${m.survivors}/${run.team.length} de pé`,
                      )}
                      {mvp && (
                        <>
                          {' '}
                          · MVP{' '}
                          <b className="text-brand">{displayName(mvp[0])}</b> (
                          {mvp[1]} KO{mvp[1] === 1 ? '' : 's'})
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
          <ul className="team-stats m-0 grid list-none gap-1.5 p-0 [&_b]:[flex:1] [&_li]:flex [&_li]:flex-wrap [&_li]:items-center [&_li]:gap-2 [&_li]:rounded-xl [&_li]:border-2 [&_li]:border-outline [&_li]:bg-panel-muted [&_li]:[padding:4px_10px_4px_4px] [&_li.is-mvp]:[outline:2px_solid_var(--primary)]">
            {totals.map((member) => {
              const p = gameData.pokemonByName.get(member.name)!
              const isMvp = runMvp?.[0] === member.name
              return (
                <li key={member.name} className={isMvp ? 'is-mvp' : ''}>
                  <Sprite pokemon={p} size={44} />
                  <b>{displayName(member.name)}</b>
                  {isMvp && (
                    <span className="rounded-full bg-accent px-[7px] py-[1px] text-[.65rem] font-extrabold text-accent-ink uppercase">
                      {t('Run MVP', 'Destaque da campanha')}
                    </span>
                  )}
                  <span className="team-stat good text-[.78rem] font-bold tabular-nums [&.bad]:text-danger [&.good]:text-success">
                    {member.kos} KO
                  </span>
                  <span className="team-stat bad text-[.78rem] font-bold tabular-nums [&.bad]:text-danger [&.good]:text-success">
                    {member.defeats}× {downLabel}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </div>
  )
}
