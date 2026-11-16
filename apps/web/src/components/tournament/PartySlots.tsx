import Image from 'next/image'
import { gameData } from '@draftmon/content'
import { TEAM_SIZE, displayName, rarityOf } from '@draftmon/engine'
import { Sprite } from '../pokemon/Sprite'
import { legendaryFrame } from '../pokemon/legendaryFrame'
import { cn } from '../ui/cn'
import { useLanguage } from '../../services/language'

/**
 * Six party slots. Caught Pokémon show their sprite (legendaries keep the
 * animated foil frame); open slots are drawn as empty Poké Balls.
 */
export function PartySlots({
  team,
  label,
  numbered = false,
  size = 'medium',
}: {
  team: string[]
  label: string
  numbered?: boolean
  size?: 'small' | 'medium'
}) {
  const { t } = useLanguage()
  const sprite = size === 'small' ? 40 : 60
  const slots = Array.from({ length: TEAM_SIZE }, (_, i) => team[i] ?? null)
  const List = numbered ? 'ol' : 'ul'
  return (
    <List
      aria-label={label}
      className="m-0 grid list-none grid-cols-6 gap-1.5 p-0"
    >
      {slots.map((name, index) => {
        const pokemon = name ? gameData.pokemonByName.get(name) : undefined
        const legendary = pokemon ? rarityOf(pokemon) : false
        return (
          <li
            key={name ?? `empty-${index}`}
            className={cn(
              'relative grid aspect-square place-items-center rounded-xl bg-panel-muted [--foil-surface:var(--card2)]',
              legendary ? legendaryFrame : 'border-2 border-outline',
            )}
          >
            {numbered && pokemon && (
              <span
                className={cn(
                  'absolute top-1 left-1.5 font-pixel text-[.55rem]',
                  index === 0 ? 'text-[color:var(--red)]' : 'text-muted',
                )}
                aria-hidden="true"
              >
                {index + 1}
              </span>
            )}
            {pokemon ? (
              <Sprite pokemon={pokemon} size={sprite} className="size-[88%]" />
            ) : (
              <>
                <Image
                  src="/pokeball.svg"
                  width={24}
                  height={24}
                  alt=""
                  className="size-[42%] opacity-30 grayscale"
                />
                <span className="sr-only">
                  {name ? displayName(name) : t('Empty slot', 'Espaço vazio')}
                </span>
              </>
            )}
          </li>
        )
      })}
    </List>
  )
}
