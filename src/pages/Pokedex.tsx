import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useEffect, useState } from 'react'
import type { ApiPokemon } from '../engine/data'
import { displayName, gameData, regionLabel, spriteOf, typesOf } from '../engine/data'
import { regionalPokedex } from '../engine/pokedex'
import { Sprite } from '../components/pokemon/Sprite'
import { StatBars } from '../components/pokemon/StatBars'
import { TypeBadge } from '../components/pokemon/TypeBadge'
import { useLanguage } from '../services/language'
import { cachedUsage, syncPokemonUsage } from '../services/pokemonUsage'
import type { UsageIdentity } from '../services/pokemonUsage'

const catalog = regionalPokedex(gameData).filter(({ pokemon }) => pokemon.length > 0)
const total = catalog.reduce((sum, { pokemon }) => sum + pokemon.length, 0)

function PokedexDetails({ pokemon, count }: { pokemon: ApiPokemon; count: number }) {
  const { t } = useLanguage()
  return (
    <Card className="pokedex-details grid gap-[9px]">
      <h2>{count ? displayName(pokemon.name) : t('Unregistered Pokémon', 'Pokémon ainda não registrado')}</h2>
      <p className="m-0 text-brand font-bold text-[.83rem]">{t(`Used in ${count} ${count === 1 ? 'battle' : 'battles'}`, `Usado em ${count} ${count === 1 ? 'batalha' : 'batalhas'}`)}</p>
      <div className="flex gap-[5px] flex-wrap">{typesOf(pokemon).map((type) => <TypeBadge key={type} type={type} tip={false} />)}</div>
      <StatBars pokemon={pokemon} />
    </Card>
  )
}

export function Pokedex({ identity, playerName, avatar, onBack }: {
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
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void syncPokemonUsage({ owner, credential }).then((value) => {
      if (!cancelled) setCounts(value)
    })
    return () => { cancelled = true }
  }, [owner, credential])

  const { region, pokemon } = catalog[regionIndex]
  const preview = pokemon.find(({ key }) => key === selected) ?? pokemon[0]
  const registered = catalog.reduce((sum, entry) => sum + entry.pokemon.filter(({ key }) => counts[key] > 0).length, 0)

  return (
    <section className="grid gap-4">
      <Card as="header" className="panel-heading flex items-center justify-between flex-wrap gap-3">
        <div className="pokedex-trainer flex items-center gap-2.5">
          <img src={avatar} alt="" width={54} height={54} />
          <div><h1>{t('My Pokédex', 'Minha Pokédex')}</h1><p className="text-muted">{playerName} · {registered}/{total} {t('registered', 'registrados')}</p></div>
        </div>
        <Button onClick={onBack}>{t('Back', 'Voltar')}</Button>
      </Card>
      <nav className="pokedex-regions flex flex-wrap gap-[7px]" aria-label={t('Pokédex regions', 'Regiões da Pokédex')}>
        {catalog.map(({ region, pokemon }, index) => (
          <Button key={region.name} aria-pressed={index === regionIndex} onClick={() => {
            setRegionIndex(index)
            setSelected(null)
            setExpanded(null)
          }}>
            {regionLabel(region)} <span>{pokemon.filter(({ key }) => counts[key] > 0).length}/{pokemon.length}</span>
          </Button>
        ))}
      </nav>
      <div className="pokedex-layout grid grid-cols-[minmax(0,1fr)_minmax(220px,290px)] gap-3.5 items-start">
        <ul className="pokedex-grid grid grid-cols-[repeat(auto-fill,minmax(98px,1fr))] gap-2 p-0 m-0 list-none" aria-label={regionLabel(region)}>
          {pokemon.map(({ key, pokemon: entry }, index) => {
            const count = counts[key] ?? 0
            return (
              <li key={key} className={expanded === key ? 'pokedex-entry-open' : undefined}>
                <button type="button" className={`pokedex-entry grid [place-content:center] justify-items-center gap-0.5 w-full min-h-[105px] bg-panel text-ink rounded-xl border border-line p-[5px] ${count ? 'registered' : 'unregistered'} ${preview.key === key ? 'previewed' : ''}`}
                  aria-label={count ? displayName(entry.name) : t(`Unregistered entry ${index + 1}`, `Registro ${index + 1} ainda desconhecido`)}
                  onPointerEnter={(event) => { if (event.pointerType !== 'touch') setSelected(key) }}
                  onFocus={() => setSelected(key)}
                  onClick={() => { setSelected(key); setExpanded(expanded === key ? null : key) }}>
                  <span className="pokedex-entry-art grid place-items-center w-18 h-18">
                    {count ? <Sprite pokemon={entry} size={68} /> : <>
                      <span className="w-17 h-17 bg-[#697bb2] [mask-position:center] [mask-size:contain] [mask-repeat:no-repeat]" style={{ maskImage: `url("${spriteOf(entry)}")` }} />
                      <span className="z-1 text-white [font:800_1.7rem/1_system-ui] [text-shadow:0_1px_4px_#131e39,0_0_7px_#131e39]" aria-hidden="true">?</span>
                    </>}
                  </span>
                  {count > 0 && <strong>{displayName(entry.name)}</strong>}
                </button>
                {expanded === key && <div className="pokedex-inline hidden"><PokedexDetails pokemon={entry} count={count} /></div>}
              </li>
            )
          })}
        </ul>
        <aside className="pokedex-preview" aria-label={t('Pokémon details', 'Detalhes do Pokémon')}>
          <PokedexDetails pokemon={preview.pokemon} count={counts[preview.key] ?? 0} />
        </aside>
      </div>
    </section>
  )
}
