import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { useState } from 'react'
import { gameData } from '@draftmon/content'
import { baseStatTotal, displayName, rarityOf, typesOf } from '@draftmon/engine'
import type { Roll } from '@draftmon/engine'
import { PLAYER_LEVEL } from '@draftmon/engine'
import { CreatureCard } from '../pokemon/CreatureCard'
import { Sprite } from '../pokemon/Sprite'
import { TypeBadge } from '../pokemon/TypeBadge'
import { useLanguage } from '../../services/language'

const legendaryBorder = cn(
  'relative border-[#a7a0bb] shadow-[0_0_12px_var(--rare-glow)]',
  '[--rare-glow:#9474d655] [--rare-ink:#493572] [--rare-tag:#ede7fa]',
  '[&.mythical]:[--rare-glow:#ae7adc55] [&.mythical]:[--rare-ink:#5a2a75] [&.mythical]:[--rare-tag:#f2e5ff]',
  'before:pointer-events-none before:absolute before:-inset-px before:animate-draft-foil before:rounded-[inherit] before:p-0.5',
  'before:[mask-composite:exclude] before:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]',
  'before:[background:conic-gradient(from_var(--foil-angle),#79809d,#f9fcff_11%,#aebbd4_17%,#9674db_26%,#e3cbfc_36%,#8ebbcf_45%,#faffff_54%,#a1a8c3_63%,#b184da_75%,#f1c5e9_83%,#e4eaf5_92%,#79809d)]',
  'motion-reduce:before:animate-none [&.mythical::before]:hue-rotate-[23deg]',
)

export function DraftList({
  roll,
  onPick,
}: {
  roll: Roll
  onPick: (name: string) => void
}) {
  const { t } = useLanguage()
  const [preview, setPreview] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const active = preview ?? roll.options[0]
  const pokemon = gameData.pokemonByName.get(active)!

  return (
    <div className="draft-results grid grid-cols-[minmax(0,1fr)_minmax(280px,.65fr)] items-start gap-4.5 compact-interaction:[grid-template-columns:minmax(0,1fr)]">
      <ul
        className="draft-list m-0 grid list-none gap-1.5 p-0"
        aria-label={t('Available Pokémon', 'Pokémon disponíveis')}
      >
        {roll.options.map((name, i) => {
          const entry = gameData.pokemonByName.get(name)!
          const rarity = rarityOf(entry)
          const wildcard = i >= roll.matches
          return (
            <li
              key={name}
              className={cn(
                'grid grid-cols-[44px_minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-panel px-3 py-[7px]',
                'compact-interaction:grid-cols-[38px_minmax(0,1fr)_auto] compact-interaction:gap-x-2 compact-interaction:gap-y-[5px]',
                rarity && [legendaryBorder, rarity.toLowerCase()],
                name === active &&
                  'border-[#527fca] bg-[#f3f7ff] dark:bg-[#344260]',
              )}
              onPointerEnter={(event) => {
                if (event.pointerType !== 'touch') setPreview(name)
              }}
              onFocus={() => setPreview(name)}
            >
              <Sprite
                pokemon={entry}
                size={44}
                className="compact-interaction:size-9.5"
              />
              <div className="grid gap-[3px] wrap-anywhere">
                <strong>{displayName(name)}</strong>
                <div className="flex flex-wrap gap-[5px]">
                  {typesOf(entry).map((type) => (
                    <TypeBadge key={type} type={type} small tip={false} />
                  ))}
                </div>
              </div>
              <span className="grid gap-0.5 text-right text-[.78rem] whitespace-nowrap text-muted">
                <span>
                  {t('Lv.', 'Nv.')} {PLAYER_LEVEL}
                </span>
                <span
                  className="draft-overall [&_strong]:text-ink [&_strong]:[font-variant-numeric:tabular-nums]"
                  title={t(
                    'Sum of the six base stats',
                    'Soma dos seis atributos base',
                  )}
                >
                  {t('Overall', 'Geral')}{' '}
                  <strong>{baseStatTotal(entry)}</strong>
                </span>
              </span>
              <Button
                className="draft-details hidden compact-interaction:[grid-column:2] compact-interaction:inline-flex compact-interaction:justify-self-start"
                type="button"
                aria-label={`${t('Details for', 'Detalhes de')} ${displayName(name)}`}
                aria-expanded={expanded === name}
                aria-controls={`draft-details-${entry.id}`}
                onClick={() => setExpanded(expanded === name ? null : name)}
              >
                {t('Details', 'Detalhes')}
              </Button>
              <Button
                tone="primary"
                className="draft-pick silent compact-interaction:[grid-column:3]"
                aria-label={`${t('Catch', 'Capturar')} ${displayName(name)}`}
                onClick={() => onPick(name)}
              >
                {t('Catch', 'Capturar')}
              </Button>
              {(rarity || wildcard) && (
                <div className="col-span-full flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {rarity && (
                    <span className="rounded-md bg-[var(--rare-tag)] px-2 py-[3px] text-[.72rem] font-extrabold text-[var(--rare-ink)]">
                      <span aria-hidden="true">✦</span>{' '}
                      {t('Legendary', 'Lendário')}
                    </span>
                  )}
                  {wildcard && (
                    <span className="rounded bg-panel-muted px-2 py-[3px] text-[.7rem] text-muted [border-left:2px_solid_#7488ae]">
                      <strong>{t('Wildcard', 'Coringa')}</strong> ·{' '}
                      {t(
                        'A Normal-type Pokémon filling an open slot',
                        'Pokémon do tipo Normal que preenche uma vaga',
                      )}
                    </span>
                  )}
                </div>
              )}
              <div
                id={`draft-details-${entry.id}`}
                className="draft-details-inline hidden compact-interaction:[&:not(:empty)]:[grid-column:1_/_-1] compact-interaction:[&:not(:empty)]:block"
              >
                {expanded === name && (
                  <CreatureCard pokemon={entry} offTheme={wildcard} />
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <aside
        className="draft-preview sticky top-3 compact-interaction:hidden"
        aria-label={t('Pokémon preview', 'Ficha do Pokémon')}
      >
        <CreatureCard
          pokemon={pokemon}
          offTheme={roll.options.indexOf(active) >= roll.matches}
        />
      </aside>
    </div>
  )
}
