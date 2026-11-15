import { displayName, spriteOf } from '../../engine/data'
import type { ApiPokemon } from '../../engine/data'

export function Sprite({ pokemon, size = 96, className = '' }: { pokemon: ApiPokemon; size?: number; className?: string }) {
  return (
    <img
      className={`sprite object-contain ${className}`}
      src={spriteOf(pokemon)}
      alt={displayName(pokemon.name)}
      width={size}
      height={size}
      draggable={false}
    />
  )
}
