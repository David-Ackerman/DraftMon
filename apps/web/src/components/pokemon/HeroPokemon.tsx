import Image from 'next/image'
import { gameData } from '@draftmon/content'
import { spriteOf } from '@draftmon/engine'

const showcase = [
  'bulbasaur',
  'charmander',
  'pikachu',
  'squirtle',
  'eevee',
  'gengar',
]
  .map((name) => gameData.pokemonByName.get(name))
  .flatMap((pokemon) => (pokemon ? [spriteOf(pokemon)] : []))
  .filter(Boolean)

export const heroPanel =
  'flex flex-col items-center rounded-[26px] border border-line px-4.5 pt-9 pb-7 text-center [background:radial-gradient(ellipse_at_50%_12%,#fff1a0_0%,transparent_55%),linear-gradient(#eaf2ff,#fff_70%)] dark:[background:radial-gradient(ellipse_at_50%_12%,#3c3549,transparent_56%),var(--card)]'

export function HeroPokemon() {
  return (
    <div className="mb-4.5 flex flex-wrap justify-center gap-[clamp(0px,2vw,22px)] max-[480px]:gap-1">
      {showcase.map((sprite) => (
        <Image
          key={sprite}
          src={sprite}
          alt=""
          width={100}
          height={100}
          unoptimized
          loading="eager"
          className="aspect-square h-auto w-[clamp(44px,12vw,100px)] object-contain drop-shadow-[0_8px_5px_#214f9c24] even:[animation-delay:-1.2s] motion-safe:animate-bob max-[480px]:w-[clamp(32px,11vw,52px)]"
        />
      ))}
    </div>
  )
}
