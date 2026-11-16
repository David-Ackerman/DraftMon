import Image from 'next/image'
import { gameData } from '@draftmon/content'
import { displayName, spriteOf } from '@draftmon/engine'
import { legendaryFrame } from './legendaryFrame'
import { cn } from '../ui/cn'
import { Localized } from '../ui/Localized'

const sprite = (name: string) => {
  const pokemon = gameData.pokemonByName.get(name)
  return pokemon ? spriteOf(pokemon) : null
}

function OnPlatform({ name, size }: { name: string; size: number }) {
  const src = sprite(name)
  if (!src) return null
  return (
    <div className="flex flex-col items-center">
      <Image
        src={src}
        alt={displayName(name)}
        width={size}
        height={size}
        unoptimized
        loading="eager"
        className="relative z-1 object-contain motion-safe:animate-bob"
        style={{ width: size, height: size }}
      />
      <div className="-mt-3 h-5.5 w-[110px] rounded-[50%] border-2 border-outline bg-[#a8d98a] dark:bg-[#2f5a3e]" />
    </div>
  )
}

/** Battle field with two partners and a legendary in its foil frame. */
export function Showcase({ className = '' }: { className?: string }) {
  const legendary = sprite('rayquaza')
  return (
    <div
      className={cn(
        'flex min-h-[260px] items-end justify-center gap-3 rounded-[20px] border-3 border-outline bg-[#dff3d2] p-4.5 max-[480px]:min-h-[200px] max-[480px]:gap-1.5 max-[480px]:p-2.5 dark:bg-[#1f3a2c]',
        className,
      )}
      aria-hidden="true"
    >
      <OnPlatform name="pikachu" size={88} />
      {legendary && (
        <div
          className={cn(
            legendaryFrame,
            'mb-4.5 flex w-[150px] flex-col items-center gap-1 rounded-2xl p-2.5 [--foil-surface:var(--card)] max-[480px]:w-[118px]',
          )}
        >
          <Image
            src={legendary}
            alt=""
            width={120}
            height={120}
            unoptimized
            loading="eager"
            className="size-[120px] object-contain max-[480px]:size-[92px]"
          />
          <strong className="font-black">{displayName('rayquaza')}</strong>
          <span className="inline-flex items-center gap-1.5 text-[.7rem] font-black text-muted uppercase">
            <Image src="/masterball.svg" width={16} height={16} alt="" />
            <Localized en="Legendary" pt="Lendário" />
          </span>
        </div>
      )}
      <OnPlatform name="charizard" size={100} />
    </div>
  )
}
