import Image from 'next/image'
import { Button } from '../ui/Button'
import { DetailsDialog } from '../ui/DetailsDialog'
import { cn } from '../ui/cn'
import { useState } from 'react'
import { gameData } from '@draftmon/content'
import { baseStatTotal, displayName, rarityOf, typesOf } from '@draftmon/engine'
import type { Roll } from '@draftmon/engine'
import { PLAYER_LEVEL } from '@draftmon/engine'
import { CreatureCard } from '../pokemon/CreatureCard'
import { legendaryFrame } from '../pokemon/legendaryFrame'
import { Sprite } from '../pokemon/Sprite'
import { TypeBadge } from '../pokemon/TypeBadge'
import { useLanguage } from '../../services/language'

export function DraftList({
  roll,
  onPick,
}: {
  roll: Roll
  onPick: (name: string) => void
}) {
  const { t } = useLanguage()
  const [preview, setPreview] = useState<string | null>(null)
  const [details, setDetails] = useState<string | null>(null)
  const active =
    preview && roll.options.includes(preview) ? preview : roll.options[0]
  const pokemon = gameData.pokemonByName.get(active)!
  const detailIndex = details ? roll.options.indexOf(details) : -1

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
                'grid grid-cols-[48px_minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2 rounded-2xl border-2 border-outline bg-panel px-3 py-2 shadow-[3px_3px_0_var(--outline)]',
                'compact-interaction:grid-cols-[40px_minmax(0,1fr)_auto] compact-interaction:gap-x-2 compact-interaction:gap-y-[5px]',
                rarity && legendaryFrame,
                name === active &&
                  (rarity
                    ? '[--foil-surface:#f6f1ff] dark:[--foil-surface:#29253e]'
                    : 'border-3 border-[#ffcb05] bg-[#fff8d6] dark:bg-[#3a3a4a]'),
              )}
              onPointerEnter={(event) => {
                if (event.pointerType !== 'touch') setPreview(name)
              }}
              onFocus={() => setPreview(name)}
            >
              <button
                type="button"
                className="silent col-span-2 grid min-w-0 cursor-pointer grid-cols-subgrid items-center rounded-md text-left focus-visible:outline-2 focus-visible:outline-brand"
                aria-haspopup="dialog"
                aria-label={`${t('Details for', 'Detalhes de')} ${displayName(name)}`}
                onClick={() => setDetails(name)}
              >
                <span className="grid size-12 place-items-center rounded-xl bg-panel-muted compact-interaction:size-10">
                  <Sprite
                    pokemon={entry}
                    size={44}
                    className="compact-interaction:size-9"
                  />
                </span>
                <span className="grid gap-[3px] wrap-anywhere">
                  <strong className="font-black">
                    {displayName(name)}{' '}
                    <span
                      aria-hidden="true"
                      className="hidden text-xs text-brand compact-interaction:inline"
                    >
                      ⓘ
                    </span>
                  </strong>
                  <span className="flex flex-wrap gap-[5px]">
                    {typesOf(entry).map((type) => (
                      <TypeBadge key={type} type={type} small tip={false} />
                    ))}
                  </span>
                </span>
              </button>
              <span className="grid gap-1 text-right text-[.78rem] font-bold whitespace-nowrap text-muted">
                <span className="font-pixel text-[.58rem]">
                  {t('Lv', 'Nv')}
                  {PLAYER_LEVEL}
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
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-outline bg-[#f1e9ff] px-2.5 py-0.5 text-[.72rem] font-black text-[#43357a] uppercase dark:bg-[#2c2550] dark:text-[#e2d7ff]">
                      <Image
                        src="/masterball.svg"
                        width={16}
                        height={16}
                        alt=""
                      />
                      {t('Legendary', 'Lendário')}
                    </span>
                  )}
                  {wildcard && (
                    <span className="rounded-full border-2 border-line bg-panel-muted px-2.5 py-0.5 text-[.7rem] font-bold text-muted">
                      <strong>{t('Wildcard', 'Coringa')}</strong> ·{' '}
                      {t(
                        'A Normal-type Pokémon filling an open slot',
                        'Pokémon do tipo Normal que preenche uma vaga',
                      )}
                    </span>
                  )}
                </div>
              )}
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
      {details && detailIndex !== -1 && (
        <DetailsDialog
          title={displayName(details)}
          onDismiss={() => setDetails(null)}
        >
          <CreatureCard
            pokemon={gameData.pokemonByName.get(details)!}
            offTheme={detailIndex >= roll.matches}
            showName={false}
            onPick={() => {
              setDetails(null)
              onPick(details)
            }}
          />
        </DetailsDialog>
      )}
    </div>
  )
}
