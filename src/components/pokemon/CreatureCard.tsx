import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useLanguage } from '../../services/language'
import { abilityOf, displayName, gameData, rarityOf, regionLabel, typesOf } from '../../engine/data'
import type { ApiPokemon } from '../../engine/data'
import { chooseMoveset } from '../../engine/battle'
import { TYPE_COLORS } from './typeColors'
import { Sprite } from './Sprite'
import { StatBars } from './StatBars'
import { TypeBadge } from './TypeBadge'
import { MoveChip } from './MoveChip'

export function CreatureCard({
  pokemon,
  onPick,
  offTheme,
}: {
  pokemon: ApiPokemon
  onPick?: () => void
  offTheme?: boolean
}) {
  const { t, language } = useLanguage()
  const moves = chooseMoveset(pokemon, gameData)
  const regions = (gameData.regionsBySpecies.get(pokemon.species?.name ?? pokemon.name) ?? [])
    .map((r) => gameData.regions.find((x) => x.name === r))
    .filter(Boolean)
    .map((r) => regionLabel(r!))
  const main = TYPE_COLORS[typesOf(pokemon)[0]]
  const rarity = rarityOf(pokemon)
  const descriptions = pokemon.species?.descriptions
  const description = descriptions?.[language] ?? descriptions?.en
  return (
    <Card className={`creature-card relative flex flex-col gap-2 [border-top:4px_solid_var(--accent)]${rarity ? ` draft-rare ${rarity.toLowerCase()}` : ''}`} style={{ ['--accent' as string]: main }}>
      {offTheme && <span className="absolute top-2.5 right-2.5 text-[.65rem] uppercase tracking-[.1em] bg-panel-text-muted py-0.5 px-2 rounded-full">{t('Wildcard', 'Coringa')}</span>}
      <div className="card-art">
        <Sprite pokemon={pokemon} size={112} />
      </div>
      <h3>{displayName(pokemon.name)}</h3>
      <div className="flex gap-[5px] flex-wrap">
        {typesOf(pokemon).map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>
      <div className="text-[.8rem] text-muted">
        {regions.join(' · ')}
        {abilityOf(pokemon) && <> · <em>{displayName(abilityOf(pokemon))}</em></>}
      </div>
      {description && <p className="m-0 py-2 px-2.5 [border-left:2px_solid_var(--accent)] rounded bg-panel-muted text-ink text-[.8rem] leading-[1.45]" lang={descriptions?.[language] ? language : 'en'}>{description}</p>}
      <StatBars pokemon={pokemon} />
      <div className="moves flex flex-wrap gap-[5px] mb-1.5">
        {moves.map((m) => (
          <MoveChip key={m.name} move={m} />
        ))}
      </div>
      {onPick && (
        <Button tone="primary" className="w-full" onClick={onPick}>
          {t('Catch', 'Capturar')} {displayName(pokemon.name)}
        </Button>
      )}
    </Card>
  )
}
