import type { Run } from '../App'
import { displayName, gameData } from '../engine/data'
import { mvpOf } from '../engine/summary'
import { Sprite } from './common'

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
  const wins = run.results.filter(Boolean).length
  const perfect = wins === run.league.length
  const lostTo = !perfect ? run.league[run.results.length - 1] : null

  const totals = run.team.map((name) => ({
    name,
    kos: run.summaries.reduce((s, m) => s + (m.kos[name] ?? 0), 0),
    defeats: run.summaries.filter((m) => m.fainted.includes(name)).length,
  }))
  const runMvp = mvpOf(Object.fromEntries(totals.map((t) => [t.name, t.kos])))

  return (
    <div className="run-end">
      <div className="card center">
        <div className="eyebrow">{run.mode === 'daily' ? 'Daily challenge' : 'Run complete'} · {playerName}</div>
        <h1 className={perfect ? 'gold' : ''}>
          {wins}–{perfect ? 0 : 1}
        </h1>
        <p className="lead">
          {perfect
            ? 'Perfect run! You are the League Champion.'
            : `You won ${wins} of ${run.league.length} matches. Knocked out by ${lostTo?.trainer.title} ${lostTo?.trainer.name} in ${lostTo?.stage}.`}
        </p>
        <div className="hero-actions">
          <button className="btn primary big" onClick={onAgain}>
            Draft a new team
          </button>
          <button className="btn big" onClick={onHome}>
            Home
          </button>
        </div>
      </div>

      <div className="summary-grid">
        <section className="card">
          <h3>Matches</h3>
          <ol className="match-list">
            {run.summaries.map((m) => {
              const trainer = gameData.trainers.find((t) => t.id === m.trainerId)!
              const mvp = mvpOf(m.kos)
              return (
                <li key={m.trainerId} className={`match-row ${m.won ? 'won' : 'lost'}`}>
                  <span className={`result-tag ${m.won ? 'won' : 'lost'}`}>{m.won ? 'W' : 'L'}</span>
                  <img src={trainer.sprite} alt="" width={36} height={36} />
                  <div className="match-info">
                    <div className="eyebrow">{m.stage}</div>
                    <b>
                      vs {trainer.title} {trainer.name}
                    </b>
                    <div className="muted small">
                      {m.turns} turns · {m.survivors}/{run.team.length} left standing
                      {mvp && (
                        <>
                          {' '}
                          · MVP <b className="mvp">{displayName(mvp[0])}</b> ({mvp[1]} KO{mvp[1] === 1 ? '' : 's'})
                        </>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="card">
          <h3>Your team</h3>
          <ul className="team-stats">
            {totals.map((t) => {
              const p = gameData.pokemonByName.get(t.name)!
              const isMvp = runMvp?.[0] === t.name
              return (
                <li key={t.name} className={isMvp ? 'is-mvp' : ''}>
                  <Sprite pokemon={p} size={44} />
                  <b>{displayName(t.name)}</b>
                  {isMvp && <span className="mvp-badge">Run MVP</span>}
                  <span className="team-stat good">{t.kos} KO</span>
                  <span className="team-stat bad">{t.defeats}× down</span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
