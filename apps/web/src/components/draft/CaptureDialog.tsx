import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { gameData } from '@draftmon/content'
import { displayName, rarityOf } from '@draftmon/engine'
import type { ApiPokemon } from '@draftmon/content'
import { TEAM_SIZE } from '@draftmon/engine'
import { Sprite } from '../pokemon/Sprite'
import { useLanguage } from '../../services/language'

const CAPTURE_DURATION = 1500

export function CaptureDialog({
  pokemon,
  team,
  onComplete,
}: {
  pokemon: ApiPokemon
  team: string[]
  onComplete: () => void
}) {
  const { t } = useLanguage()
  const dialog = useRef<HTMLDialogElement>(null)
  const complete = useRef(onComplete)
  complete.current = onComplete

  useEffect(() => {
    const panel = dialog.current!
    panel.showModal()
    const timer = window.setTimeout(() => complete.current(), CAPTURE_DURATION)
    return () => {
      window.clearTimeout(timer)
      panel.close()
    }
  }, [])

  return (
    <dialog
      ref={dialog}
      className="capture-dialog m-auto box-border max-h-[calc(100dvh-24px)] w-[min(450px,calc(100vw-24px))] rounded-[18px] px-3 pt-[22px] pb-[26px] text-center text-ink shadow-[0_15px_36px_#18244a50] [background:radial-gradient(ellipse_at_50%_20%,#fff3b5,var(--card)_66%)] [border:2px_solid_#6b91d1] dark:[background:radial-gradient(ellipse_at_50%_20%,#483752,var(--card)_68%)] [&_h2]:[margin:2px_0_5px] [&_p]:[margin:0_0_14px] [&_p]:font-bold [&_p]:text-brand [&::backdrop]:bg-[#17284c80]"
      aria-labelledby="capture-title"
      onCancel={(event) => event.preventDefault()}
    >
      <div
        className="capture-art grid [height:clamp(88px,23vh,150px)] place-items-center [&_.sprite]:animate-capture-sprite motion-reduce:[&_.sprite]:[animation:none] [&_>_img]:[grid-area:1_/_1]"
        aria-hidden="true"
      >
        <Sprite pokemon={pokemon} size={126} />
        <Image
          className="capture-ball animate-capture-ball motion-reduce:[transform:translate(64px,25px)_scale(.68)] motion-reduce:[animation:none]"
          src={rarityOf(pokemon) ? '/masterball.svg' : '/pokeball.svg'}
          alt=""
          width={58}
          height={58}
          unoptimized
          loading="eager"
        />
      </div>
      <h2 id="capture-title">
        {t(
          `${displayName(pokemon.name)} was caught!`,
          `${displayName(pokemon.name)} foi capturado!`,
        )}
      </h2>
      <p>
        {t('Added to your team', 'Entrou para sua equipe')} · {team.length + 1}/
        {TEAM_SIZE}
      </p>
      <ol
        className="capture-team mx-auto my-0 grid max-w-86 list-none grid-cols-[repeat(6,minmax(0,1fr))] gap-[5px] p-0 [&_.capture-slot]:bg-[#fff2b6] [&_.capture-slot]:shadow-[0_0_0_3px_#ffcb0550] [&_.capture-slot]:[border:2px_solid_#ae770c] [&_.slot]:aspect-square [&_.slot]:h-auto [&_.slot]:w-full [&_.slot_img]:max-h-full [&_.slot_img]:max-w-full"
        aria-label={t('Your team', 'Sua equipe')}
      >
        {Array.from({ length: TEAM_SIZE }, (_, index) => {
          const member =
            index === team.length
              ? pokemon
              : gameData.pokemonByName.get(team[index])
          return (
            <li
              key={index}
              className={`slot grid h-16 w-16 place-items-center rounded-xl border-2 border-dashed border-line font-bold text-muted [&.filled]:[border-style:solid] [&.filled]:bg-panel [&.next]:[border-style:dashed] [&.next]:border-accent [&.next]:text-brand ${member ? 'filled' : ''} ${index === team.length ? 'capture-slot dark:bg-[#493e31] [&_.sprite]:animate-capture-arrival motion-reduce:[&_.sprite]:[animation:none]' : ''}`}
            >
              {member ? (
                <Sprite pokemon={member} size={42} />
              ) : (
                <span>{index + 1}</span>
              )}
            </li>
          )
        })}
      </ol>
    </dialog>
  )
}
