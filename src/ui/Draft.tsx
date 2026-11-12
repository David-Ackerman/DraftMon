import type { Run } from '../App'
import { displayName, gameData, regionDescription, regionLabel } from '../engine/data'
import type { RerollMode } from '../engine/game'
import { TEAM_SIZE } from '../engine/game'
import { CreatureCard, Sprite, TypeBadge } from './common'

export function Draft({
  run,
  onPick,
  onReroll,
}: {
  run: Run
  onPick: (name: string) => void
  onReroll: (mode: RerollMode) => void
}) {
  const roll = run.roll!
  const region = gameData.regions.find((r) => r.name === roll.region)
  const noRerolls = run.rerollsLeft <= 0
  return (
    <div className="draft">
      <div className="team-strip">
        {Array.from({ length: TEAM_SIZE }, (_, i) => {
          const p = run.team[i] ? gameData.pokemonByName.get(run.team[i]) : undefined
          return (
            <div key={i} className={`slot ${p ? 'filled' : ''}`} title={p ? displayName(p.name) : 'Empty'}>
              {p ? <Sprite pokemon={p} size={52} /> : <span>{i + 1}</span>}
            </div>
          )
        })}
      </div>

      <div className="roll-header">
        <div>
          <div className="eyebrow">
            Pick {run.team.length + 1} of {TEAM_SIZE}
          </div>
          <h2>
            {region ? regionLabel(region) : displayName(roll.region)} <span className="dot">·</span>{' '}
            <TypeBadge type={roll.type} />
          </h2>
          {region && <p className="muted">{regionDescription(region)}</p>}
        </div>
        <div className="reroll-box">
          <div className="reroll-count">
            {run.rerollsLeft} reroll{run.rerollsLeft === 1 ? '' : 's'} left
          </div>
          <div className="reroll-buttons">
            <button className="btn" disabled={noRerolls} onClick={() => onReroll('type')} title="Keep the region, roll a new type">
              ↻ Type
            </button>
            <button className="btn" disabled={noRerolls} onClick={() => onReroll('region')} title="Keep the type, roll a new region">
              ↻ Region
            </button>
            <button className="btn" disabled={noRerolls} onClick={() => onReroll('both')} title="Roll a new region and type">
              ↻ Both
            </button>
          </div>
        </div>
      </div>

      <div className="options">
        {roll.options.map((name, i) => {
          const p = gameData.pokemonByName.get(name)!
          return <CreatureCard key={name} pokemon={p} offTheme={i >= roll.matches} onPick={() => onPick(name)} />
        })}
      </div>
    </div>
  )
}
