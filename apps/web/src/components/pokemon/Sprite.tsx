import Image from 'next/image'
import { displayName, spriteOf } from '@draftmon/engine'
import type { ApiPokemon } from '@draftmon/content'

export function Sprite({
  pokemon,
  size = 96,
  className = '',
}: {
  pokemon: ApiPokemon
  size?: number
  className?: string
}) {
  const src = spriteOf(pokemon)
  if (!src) return null
  return (
    <Image
      className={`sprite object-contain ${className}`}
      src={src}
      alt={displayName(pokemon.name)}
      width={size}
      height={size}
      draggable={false}
      unoptimized
    />
  )
}
