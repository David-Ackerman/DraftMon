import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useLanguage } from '../../services/language'
import { gameData } from '@draftmon/content'
import {
  abilityOf,
  displayName,
  rarityOf,
  regionLabel,
  typesOf,
} from '@draftmon/engine'
import type { ApiPokemon } from '@draftmon/content'
import { chooseMoveset } from '@draftmon/engine'
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
  const regions = (
    gameData.regionsBySpecies.get(pokemon.species?.name ?? pokemon.name) ?? []
  )
    .map((r) => gameData.regions.find((x) => x.name === r))
    .filter(Boolean)
    .map((r) => regionLabel(r!))
  const main = TYPE_COLORS[typesOf(pokemon)[0]]
  const rarity = rarityOf(pokemon)
  const descriptions = pokemon.species?.descriptions
  const description = descriptions?.[language] ?? descriptions?.en
  return (
    <Card
      className={`creature-card relative flex flex-col gap-2 [&_.btn]:mt-auto [&_h3]:m-0 [&_h3]:text-[1.25rem] [&.draft-rare]:relative [&.draft-rare]:border-[color:#a7a0bb] [&.draft-rare]:shadow-[0_0_12px_var(--rare-glow)] [&.draft-rare::before]:[padding:3px] [border-top:4px_solid_var(--accent)]${rarity ? `draft-rare [--rare-glow:#9474d655] [--rare-ink:#493572] [--rare-tag:#ede7fa] [&.mythical]:[--rare-glow:#ae7adc55] [&.mythical]:[--rare-ink:#5a2a75] [&.mythical]:[--rare-tag:#f2e5ff] [&.mythical::before]:[filter:hue-rotate(23deg)] [&::before]:pointer-events-none [&::before]:absolute [&::before]:[inset:-1px] [&::before]:animate-draft-foil [&::before]:rounded-[inherit] [&::before]:[mask-composite:exclude] [&::before]:[padding:2px] [&::before]:[content:''] [&::before]:[background:conic-gradient(from_var(--foil-angle),#79809d,#f9fcff_11%,#aebbd4_17%,#9674db_26%,#e3cbfc_36%,#8ebbcf_45%,#faffff_54%,#a1a8c3_63%,#b184da_75%,#f1c5e9_83%,#e4eaf5_92%,#79809d)] [&::before]:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] motion-reduce:[&::before]:[animation:none] ${rarity.toLowerCase()}` : ''}`}
      style={{ ['--accent' as string]: main }}
    >
      {offTheme && (
        <span className="bg-panel-text-muted absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[.65rem] tracking-[.1em] uppercase">
          {t('Wildcard', 'Coringa')}
        </span>
      )}
      <div className="card-art grid place-items-center rounded-[12px] [padding:6px] [background:radial-gradient(circle,color-mix(in_srgb,var(--accent)_25%,white)_0%,transparent_74%),#f6f8fe] dark:bg-panel-muted">
        <Sprite pokemon={pokemon} size={112} />
      </div>
      <h3>{displayName(pokemon.name)}</h3>
      <div className="flex flex-wrap gap-[5px]">
        {typesOf(pokemon).map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>
      <div className="text-[.8rem] text-muted">
        {regions.join(' · ')}
        {abilityOf(pokemon) && (
          <>
            {' '}
            · <em>{displayName(abilityOf(pokemon))}</em>
          </>
        )}
      </div>
      {description && (
        <p
          className="m-0 rounded bg-panel-muted px-2.5 py-2 text-[.8rem] leading-[1.45] text-ink [border-left:2px_solid_var(--accent)]"
          lang={descriptions?.[language] ? language : 'en'}
        >
          {description}
        </p>
      )}
      <StatBars pokemon={pokemon} />
      <div className="moves mb-1.5 flex flex-wrap gap-[5px] [&.compact_.move-chip]:[padding:2px_6px] [&.compact_.move-chip]:text-[.68rem]">
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
