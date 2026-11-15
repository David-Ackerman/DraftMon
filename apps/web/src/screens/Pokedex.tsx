import Image from 'next/image'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { DetailsDialog } from '../components/ui/DetailsDialog'
import { useEffect, useState } from 'react'
import type { ApiPokemon } from '@draftmon/content'
import { gameData } from '@draftmon/content'
import { displayName, regionLabel, spriteOf, typesOf } from '@draftmon/engine'
import { regionalPokedex } from '@draftmon/engine'
import { Sprite } from '../components/pokemon/Sprite'
import { StatBars } from '../components/pokemon/StatBars'
import { TypeBadge } from '../components/pokemon/TypeBadge'
import { useLanguage } from '../services/language'
import { cachedUsage, syncPokemonUsage } from '../services/pokemonUsage'
import type { UsageIdentity } from '../services/pokemonUsage'

const catalog = regionalPokedex(gameData).filter(
  ({ pokemon }) => pokemon.length > 0,
)
const total = catalog.reduce((sum, { pokemon }) => sum + pokemon.length, 0)

function PokedexDetails({
  pokemon,
  count,
  showTitle = true,
}: {
  pokemon: ApiPokemon
  count: number
  showTitle?: boolean
}) {
  const { t } = useLanguage()
  return (
    <Card className="pokedex-details grid gap-[9px] [&_h2]:m-0 [&_h2]:text-[1.1rem]">
      {showTitle && (
        <h2>
          {count
            ? displayName(pokemon.name)
            : t('Unregistered Pokémon', 'Pokémon ainda não registrado')}
        </h2>
      )}
      <p className="m-0 text-[.83rem] font-bold text-brand">
        {t(
          `Used in ${count} ${count === 1 ? 'battle' : 'battles'}`,
          `Usado em ${count} ${count === 1 ? 'batalha' : 'batalhas'}`,
        )}
      </p>
      <div className="flex flex-wrap gap-[5px]">
        {typesOf(pokemon).map((type) => (
          <TypeBadge key={type} type={type} tip={false} />
        ))}
      </div>
      <StatBars pokemon={pokemon} />
    </Card>
  )
}

export function Pokedex({
  identity,
  playerName,
  avatar,
  onBack,
}: {
  identity: UsageIdentity
  playerName: string
  avatar: string
  onBack: () => void
}) {
  const { t } = useLanguage()
  const { owner, credential } = identity
  const [counts, setCounts] = useState(() => cachedUsage(owner))
  const [regionIndex, setRegionIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [details, setDetails] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void syncPokemonUsage({ owner, credential }).then((value) => {
      if (!cancelled) setCounts(value)
    })
    return () => {
      cancelled = true
    }
  }, [owner, credential])

  const { region, pokemon } = catalog[regionIndex]
  const preview = pokemon.find(({ key }) => key === selected) ?? pokemon[0]
  const active = pokemon.find(({ key }) => key === details)
  const activeCount = active ? (counts[active.key] ?? 0) : 0
  const registered = catalog.reduce(
    (sum, entry) =>
      sum + entry.pokemon.filter(({ key }) => counts[key] > 0).length,
    0,
  )

  return (
    <section className="grid gap-4">
      <Card
        as="header"
        className="panel-heading flex flex-wrap items-center justify-between gap-3 [&_h1]:[margin:0_0_4px] [&_h1]:text-[clamp(1.55rem,4vw,2.4rem)] [&_h1]:wrap-anywhere [&_p]:m-0"
      >
        <div className="pokedex-trainer flex items-center gap-2.5 [&_img]:rounded-[10px] [&_img]:bg-panel-muted [&_img]:[image-rendering:pixelated]">
          <Image
            src={avatar}
            alt=""
            width={54}
            height={54}
            unoptimized
            loading="eager"
          />
          <div>
            <h1>{t('My Pokédex', 'Minha Pokédex')}</h1>
            <p className="text-muted">
              {playerName} · {registered}/{total}{' '}
              {t('registered', 'registrados')}
            </p>
          </div>
        </div>
        <Button onClick={onBack}>{t('Back', 'Voltar')}</Button>
      </Card>
      <nav
        className="pokedex-regions flex flex-wrap gap-[7px] [&_button]:[padding:6px_9px] [&_button]:text-[.85rem] [&_button_span]:text-[.72rem] [&_button[aria-pressed='true']]:border-[color:#b78216] [&_button[aria-pressed='true']]:bg-accent [&_button[aria-pressed='true']]:text-accent-ink"
        aria-label={t('Pokédex regions', 'Regiões da Pokédex')}
      >
        {catalog.map(({ region, pokemon }, index) => (
          <Button
            key={region.name}
            aria-pressed={index === regionIndex}
            onClick={() => {
              setRegionIndex(index)
              setSelected(null)
              setDetails(null)
            }}
          >
            {regionLabel(region)}{' '}
            <span>
              {pokemon.filter(({ key }) => counts[key] > 0).length}/
              {pokemon.length}
            </span>
          </Button>
        ))}
      </nav>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(220px,290px)] items-start gap-3.5 compact-interaction:grid-cols-1">
        <ul
          className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(98px,1fr))] gap-2 p-0 compact-interaction:grid-cols-[repeat(auto-fill,minmax(min(88px,100%),1fr))]"
          aria-label={regionLabel(region)}
        >
          {pokemon.map(({ key, pokemon: entry }, index) => {
            const count = counts[key] ?? 0
            return (
              <li key={key} className="min-w-0">
                <button
                  type="button"
                  className={`pokedex-entry grid min-h-[105px] w-full [place-content:center] justify-items-center gap-0.5 rounded-xl border border-line bg-panel p-[5px] text-ink [&_strong]:text-[.75rem] [&_strong]:[line-height:1.15] [&_strong]:[font-weight:650] [&_strong]:wrap-anywhere [&.previewed]:border-brand [&.unregistered]:bg-panel-muted [&:hover]:border-brand ${count ? 'registered' : 'unregistered'} ${preview.key === key ? 'previewed' : ''}`}
                  aria-label={
                    count
                      ? displayName(entry.name)
                      : t(
                          `Unregistered entry ${index + 1}`,
                          `Registro ${index + 1} ainda desconhecido`,
                        )
                  }
                  aria-haspopup="dialog"
                  onPointerEnter={(event) => {
                    if (event.pointerType !== 'touch') setSelected(key)
                  }}
                  onFocus={() => setSelected(key)}
                  onClick={() => {
                    setSelected(key)
                    setDetails(key)
                  }}
                >
                  <span className="pokedex-entry-art grid h-18 w-18 place-items-center [&_>_*]:[grid-area:1_/_1]">
                    {count ? (
                      <Sprite pokemon={entry} size={68} />
                    ) : (
                      <>
                        <span
                          className="h-17 w-17 bg-[#697bb2] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]"
                          style={{ maskImage: `url("${spriteOf(entry)}")` }}
                        />
                        <span
                          className="z-1 text-white [font:800_1.7rem/1_system-ui] [text-shadow:0_1px_4px_#131e39,0_0_7px_#131e39]"
                          aria-hidden="true"
                        >
                          ?
                        </span>
                      </>
                    )}
                  </span>
                  {count > 0 && <strong>{displayName(entry.name)}</strong>}
                </button>
              </li>
            )
          })}
        </ul>
        <aside
          className="pokedex-preview sticky top-3 compact-interaction:hidden"
          aria-label={t('Pokémon details', 'Detalhes do Pokémon')}
        >
          <PokedexDetails
            pokemon={preview.pokemon}
            count={counts[preview.key] ?? 0}
          />
        </aside>
      </div>
      {active && (
        <DetailsDialog
          title={
            activeCount
              ? displayName(active.pokemon.name)
              : t('Unregistered Pokémon', 'Pokémon ainda não registrado')
          }
          onDismiss={() => setDetails(null)}
        >
          <PokedexDetails
            pokemon={active.pokemon}
            count={activeCount}
            showTitle={false}
          />
        </DetailsDialog>
      )}
    </section>
  )
}
