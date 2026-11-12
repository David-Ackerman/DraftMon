import type { ApiMove, ApiPokemon } from '../engine/data'
import { abilityOf, baseStat, baseStatTotal, displayName, gameData, moveEffect, regionLabel, spriteOf, STAT_LABELS, STAT_NAMES, typesOf } from '../engine/data'
import { chooseMoveset } from '../engine/battle'

export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C', grass: '#7AC74C',
  ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65', flying: '#A98FF3',
  psychic: '#F95587', bug: '#A6B91A', rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC',
  dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD',
}
const DARK_TEXT = new Set(['electric', 'ice', 'ground', 'steel', 'normal', 'grass', 'bug', 'rock'])

export function TypeBadge({ type, small }: { type: string; small?: boolean }) {
  return (
    <span
      className={`type-badge${small ? ' small' : ''}`}
      style={{ background: TYPE_COLORS[type] ?? '#888', color: DARK_TEXT.has(type) ? '#1d1d1d' : '#fff' }}
    >
      {type}
    </span>
  )
}

export function Sprite({ pokemon, size = 96, className = '' }: { pokemon: ApiPokemon; size?: number; className?: string }) {
  return (
    <img
      className={`sprite ${className}`}
      src={spriteOf(pokemon)}
      alt={displayName(pokemon.name)}
      width={size}
      height={size}
      draggable={false}
    />
  )
}

const statColor = (v: number) => (v >= 110 ? '#3ddc97' : v >= 85 ? '#9be15d' : v >= 60 ? '#f7d02c' : '#ff7a59')

export function StatBars({ pokemon }: { pokemon: ApiPokemon }) {
  return (
    <div className="stats">
      {STAT_NAMES.map((s) => {
        const v = baseStat(pokemon, s)
        return (
          <div className="stat-row" key={s}>
            <span className="stat-label">{STAT_LABELS[s]}</span>
            <span className="stat-value">{v}</span>
            <span className="stat-track">
              <span className="stat-fill" style={{ width: `${Math.min(100, (v / 150) * 100)}%`, background: statColor(v) }} />
            </span>
          </div>
        )
      })}
      <div className="stat-row total">
        <span className="stat-label">Total</span>
        <span className="stat-value">{baseStatTotal(pokemon)}</span>
      </div>
    </div>
  )
}

export function MoveChip({ move }: { move: ApiMove }) {
  const cls = move.damage_class.name
  return (
    <span className="move-chip" title={moveEffect(move)} style={{ borderColor: TYPE_COLORS[move.type.name] }}>
      <span className="move-dot" style={{ background: TYPE_COLORS[move.type.name] }} />
      {displayName(move.name)}
      <span className="move-meta">{cls === 'status' ? 'status' : `${move.power} ${cls === 'physical' ? 'phys' : 'spec'}`}</span>
    </span>
  )
}

export function CreatureCard({
  pokemon,
  onPick,
  offTheme,
}: {
  pokemon: ApiPokemon
  onPick?: () => void
  offTheme?: boolean
}) {
  const moves = chooseMoveset(pokemon, gameData)
  const regions = (gameData.regionsBySpecies.get(pokemon.species?.name ?? pokemon.name) ?? [])
    .map((r) => gameData.regions.find((x) => x.name === r))
    .filter(Boolean)
    .map((r) => regionLabel(r!))
  const main = TYPE_COLORS[typesOf(pokemon)[0]]
  return (
    <div className="card creature-card" style={{ ['--accent' as string]: main }}>
      {offTheme && <span className="wildcard">wildcard</span>}
      <div className="card-art">
        <Sprite pokemon={pokemon} size={112} />
      </div>
      <h3>{displayName(pokemon.name)}</h3>
      <div className="badges">
        {typesOf(pokemon).map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>
      <div className="card-sub">
        {regions.join(' · ')}
        {abilityOf(pokemon) && <> · <em>{displayName(abilityOf(pokemon))}</em></>}
      </div>
      <StatBars pokemon={pokemon} />
      <div className="moves">
        {moves.map((m) => (
          <MoveChip key={m.name} move={m} />
        ))}
      </div>
      {onPick && (
        <button className="btn primary block" onClick={onPick}>
          Pick {displayName(pokemon.name)}
        </button>
      )}
    </div>
  )
}

export function HpBar({ hp, max }: { hp: number; max: number }) {
  const pct = Math.max(0, (hp / max) * 100)
  const color = pct > 50 ? '#3ddc97' : pct > 20 ? '#f7d02c' : '#ff5c5c'
  return (
    <div className="hp">
      <div className="hp-track">
        <div className="hp-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="hp-text">
        {Math.max(0, hp)}/{max}
      </span>
    </div>
  )
}

const STATUS_LABEL: Record<string, [string, string]> = {
  burn: ['BRN', '#EE8130'],
  poison: ['PSN', '#A33EA1'],
  paralysis: ['PAR', '#c9a400'],
  sleep: ['SLP', '#7f8c9a'],
  freeze: ['FRZ', '#4fb3d9'],
}
export function StatusTag({ status }: { status: string | null }) {
  if (!status) return null
  const [label, color] = STATUS_LABEL[status] ?? [status, '#666']
  return (
    <span className="status-tag" style={{ background: color }}>
      {label}
    </span>
  )
}
