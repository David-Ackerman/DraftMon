import { gameData } from '../engine/data'
import { LEAGUE_MATCHES, OPTIONS_PER_ROLL, REROLLS_PER_RUN, TEAM_SIZE } from '../engine/game'
import type { PlayerStats } from './storage'
import { Sprite } from './common'

export function Home({ stats, onStart }: { stats: PlayerStats; onStart: (mode: 'random' | 'daily') => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const showcase = ['ashwyrm', 'tempestra', 'morbelich', 'seraphyne', 'voltitan', 'aurorym']
    .map((n) => gameData.pokemonByName.get(n))
    .filter((p) => p !== undefined)
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-sprites">
          {showcase.map((p) => (
            <Sprite key={p.name} pokemon={p} size={72} />
          ))}
        </div>
        <h1>
          Draft a team. Win {LEAGUE_MATCHES}–0.
        </h1>
        <p className="lead">
          Roll creatures by region and type, build a team of {TEAM_SIZE}, then battle through a {LEAGUE_MATCHES}-match
          league of rival trainers. One loss ends the run.
        </p>
        <div className="hero-actions">
          <button className="btn primary big" onClick={() => onStart('random')}>
            Play as guest
          </button>
          <button className="btn big" onClick={() => onStart('daily')}>
            Daily challenge
            {stats.dailyBest[today] !== undefined && <span className="chip">best {stats.dailyBest[today]}/7</span>}
          </button>
        </div>
        <p className="muted small">Accounts are coming soon. Guest progress is saved in this browser.</p>
      </section>

      <section className="home-grid">
        <div className="card">
          <h3>How it works</h3>
          <ol className="steps">
            <li>
              Each roll shows <b>{OPTIONS_PER_ROLL} creatures</b> from one region and type.
            </li>
            <li>
              Use your <b>{REROLLS_PER_RUN} rerolls</b> to change the type, the region, or both.
            </li>
            <li>Pick one per roll until your team of {TEAM_SIZE} is complete.</li>
            <li>Reorder your team before every match. Your lead matters!</li>
            <li>Battles are automatic. Type advantages decide a lot.</li>
          </ol>
        </div>
        <div className="card">
          <h3>Your record</h3>
          <div className="record">
            <div>
              <b>{stats.runs}</b>
              <span>runs</span>
            </div>
            <div>
              <b>{stats.best}/7</b>
              <span>best</span>
            </div>
            <div>
              <b>{stats.perfect}</b>
              <span>perfect 7–0</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
