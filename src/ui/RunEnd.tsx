import type { Run } from '../App'
import { gameData } from '../engine/data'
import { Sprite } from './common'

export function RunEnd({ run, onAgain, onHome }: { run: Run; onAgain: () => void; onHome: () => void }) {
  const wins = run.results.filter(Boolean).length
  const perfect = wins === run.league.length
  const lostTo = !perfect ? run.league[run.results.length - 1] : null
  return (
    <div className="run-end">
      <div className="card center">
        <div className="eyebrow">{run.mode === 'daily' ? 'Daily challenge' : 'Run complete'}</div>
        <h1 className={perfect ? 'gold' : ''}>
          {wins}–{perfect ? 0 : 1}
        </h1>
        <p className="lead">
          {perfect
            ? 'Perfect run! You are the League Champion.'
            : `You won ${wins} of ${run.league.length} matches. Knocked out by ${lostTo?.trainer.title} ${lostTo?.trainer.name} in the ${lostTo?.stage}.`}
        </p>
        <div className="final-team">
          {run.team.map((n) => (
            <Sprite key={n} pokemon={gameData.pokemonByName.get(n)!} size={64} />
          ))}
        </div>
        <div className="hero-actions">
          <button className="btn primary big" onClick={onAgain}>
            Draft a new team
          </button>
          <button className="btn big" onClick={onHome}>
            Home
          </button>
        </div>
      </div>
    </div>
  )
}
