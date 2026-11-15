import { useEffect, useRef } from 'react'
import { displayName, gameData, rarityOf } from '../../engine/data'
import type { ApiPokemon } from '../../engine/data'
import { TEAM_SIZE } from '../../engine/game'
import { Sprite } from '../pokemon/Sprite'
import { useLanguage } from '../../services/language'

const CAPTURE_DURATION = 1500

export function CaptureDialog({ pokemon, team, onComplete }: { pokemon: ApiPokemon; team: string[]; onComplete: () => void }) {
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
    <dialog ref={dialog} className="capture-dialog" aria-labelledby="capture-title" onCancel={(event) => event.preventDefault()}>
      <div className="capture-art grid place-items-center [height:clamp(88px,23vh,150px)]" aria-hidden="true">
        <Sprite pokemon={pokemon} size={126} />
        <img className="capture-ball [animation:capture-ball_.88s_ease-in-out_both]" src={rarityOf(pokemon) ? '/masterball.svg' : '/pokeball.svg'} alt="" width={58} height={58} />
      </div>
      <h2 id="capture-title">{t(`${displayName(pokemon.name)} was caught!`, `${displayName(pokemon.name)} foi capturado!`)}</h2>
      <p>{t('Added to your team', 'Entrou para sua equipe')} · {team.length + 1}/{TEAM_SIZE}</p>
      <ol className="capture-team my-0 mx-auto p-0 list-none grid grid-cols-[repeat(6,minmax(0,1fr))] gap-[5px] max-w-86" aria-label={t('Your team', 'Sua equipe')}>
        {Array.from({ length: TEAM_SIZE }, (_, index) => {
          const member = index === team.length ? pokemon : gameData.pokemonByName.get(team[index])
          return (
            <li key={index} className={`slot w-16 h-16 rounded-xl border-2 border-dashed border-line grid place-items-center text-muted font-bold ${member ? 'filled' : ''} ${index === team.length ? 'capture-slot' : ''}`}>
              {member ? <Sprite pokemon={member} size={42} /> : <span>{index + 1}</span>}
            </li>
          )
        })}
      </ol>
    </dialog>
  )
}
