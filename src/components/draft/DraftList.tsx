import { Button } from '../ui/Button'
import { useState } from 'react'
import { baseStatTotal, displayName, gameData, rarityOf, typesOf } from '../../engine/data'
import type { Roll } from '../../engine/game'
import { PLAYER_LEVEL } from '../../engine/game'
import { CreatureCard } from '../pokemon/CreatureCard'
import { Sprite } from '../pokemon/Sprite'
import { TypeBadge } from '../pokemon/TypeBadge'
import { useLanguage } from '../../services/language'

export function DraftList({ roll, onPick }: { roll: Roll; onPick: (name: string) => void }) {
  const { t } = useLanguage()
  const [preview, setPreview] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const active = preview ?? roll.options[0]
  const pokemon = gameData.pokemonByName.get(active)!

  return (
    <div className="draft-results grid grid-cols-[minmax(0,1fr)_minmax(280px,.65fr)] gap-4.5 items-start">
      <ul className="draft-list list-none m-0 p-0 grid gap-1.5" aria-label={t('Available Pokémon', 'Pokémon disponíveis')}>
        {roll.options.map((name, i) => {
          const entry = gameData.pokemonByName.get(name)!
          const rarity = rarityOf(entry)
          const wildcard = i >= roll.matches
          return (
            <li key={name} className={`${name === active ? 'previewed' : ''} ${rarity ? `draft-rare ${rarity.toLowerCase()}` : ''}`} onPointerEnter={(event) => {
              if (event.pointerType !== 'touch') setPreview(name)
            }} onFocus={() => setPreview(name)}>
              <Sprite pokemon={entry} size={44} />
              <div className="grid gap-[3px] [overflow-wrap:anywhere]">
                <strong>{displayName(name)}</strong>
                <div className="flex gap-[5px] flex-wrap">
                  {typesOf(entry).map((type) => <TypeBadge key={type} type={type} small tip={false} />)}
                </div>
              </div>
              <span className="grid gap-0.5 text-muted text-[.78rem] text-right whitespace-nowrap">
                <span>{t('Lv.', 'Nv.')} {PLAYER_LEVEL}</span>
                <span className="draft-overall" title={t('Sum of the six base stats', 'Soma dos seis atributos base')}>
                  {t('Overall', 'Geral')} <strong>{baseStatTotal(entry)}</strong>
                </span>
              </span>
              <Button className="draft-details" type="button" aria-label={`${t('Details for', 'Detalhes de')} ${displayName(name)}`} aria-expanded={expanded === name} aria-controls={`draft-details-${entry.id}`} onClick={() => setExpanded(expanded === name ? null : name)}>{t('Details', 'Detalhes')}</Button>
              <Button tone="primary" className="draft-pick silent" aria-label={`${t('Catch', 'Capturar')} ${displayName(name)}`} onClick={() => onPick(name)}>{t('Catch', 'Capturar')}</Button>
              {(rarity || wildcard) && <div className="col-span-full flex flex-wrap items-baseline gap-y-1 gap-x-2">
                {rarity && <span className="text-[.72rem] font-extrabold text-[var(--rare-ink)] bg-[var(--rare-tag)] py-[3px] px-2 rounded-md"><span aria-hidden="true">✦</span> {t('Legendary', 'Lendário')}</span>}
                {wildcard && <span className="text-muted bg-panel-muted [border-left:2px_solid_#7488ae] rounded py-[3px] px-2 text-[.7rem]">
                  <strong>{t('Wildcard', 'Coringa')}</strong> · {t('A Normal-type Pokémon filling an open slot', 'Pokémon do tipo Normal que preenche uma vaga')}
                </span>}
              </div>}
              <div id={`draft-details-${entry.id}`} className="draft-details-inline">
                {expanded === name && <CreatureCard pokemon={entry} offTheme={wildcard} />}
              </div>
            </li>
          )
        })}
      </ul>
      <aside className="draft-preview sticky top-3" aria-label={t('Pokémon preview', 'Ficha do Pokémon')}>
        <CreatureCard pokemon={pokemon} offTheme={roll.options.indexOf(active) >= roll.matches} />
      </aside>
    </div>
  )
}
