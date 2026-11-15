import Image from 'next/image'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  LEAGUE_MATCHES,
  OPTIONS_PER_ROLL,
  REROLLS_PER_RUN,
  TEAM_SIZE,
} from '@draftmon/engine'
import type { PlayerStats } from '../services/storage'
import { HeroPokemon, heroPanel } from '../components/pokemon/HeroPokemon'
import { avatars, avatarSprite } from '../services/guest'
import type { Guest } from '../services/guest'
import { useLanguage } from '../services/language'
import { AvatarLore } from '../components/pokemon/LoreCard'
import { protagonists } from '../components/pokemon/lore'

export function Home({
  stats,
  name,
  guest,
  onNameChange,
  onAvatarChange,
  onStart,
  onLobby,
}: {
  stats: PlayerStats
  name: string
  guest: Guest
  onNameChange: (name: string) => void
  onAvatarChange: (avatar: string) => void
  onStart: (mode: 'random' | 'daily') => void
  onLobby: () => void
}) {
  const { t } = useLanguage()
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="home">
      <section className={heroPanel}>
        <HeroPokemon />
        <h1>{t('Build your Pokémon team.', 'Monte sua equipe Pokémon.')}</h1>
        <p className="max-w-160 text-[1.1rem] text-muted">
          {t(
            `Catch Pokémon by region and type, then take your team of ${TEAM_SIZE} into a ${LEAGUE_MATCHES}-match league against Gym Leaders, Elite Four members and Champions. One loss ends the run.`,
            `Capture Pokémon por região e tipo e leve sua equipe de ${TEAM_SIZE} a uma liga de ${LEAGUE_MATCHES} partidas contra Líderes de Ginásio, a Elite dos Quatro e Campeões. Uma derrota encerra a campanha.`,
          )}
        </p>
        <section
          className="guest-card [width:min(100%,630px)] rounded-2xl border border-line bg-panel p-3.5 text-left [&_.name-field]:m-0 [&_.name-field]:[flex:1_1_170px] [&_.name-field_input]:w-full"
          aria-label={t(
            'Guest trainer profile',
            'Perfil de treinador convidado',
          )}
        >
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2.5">
            <label className="name-field mt-1.5 grid gap-1 text-left [&_input]:w-60 [&_input]:max-w-full [&_input]:rounded-[10px] [&_input]:bg-panel [&_input]:[padding:10px_12px] [&_input]:text-ink [&_input]:[border:1px_solid_var(--line)] [&_input]:[font:inherit] [&_input:focus]:[outline:2px_solid_var(--primary)] [&_input:focus]:outline-offset-1 [&_span]:text-[.75rem] [&_span]:font-semibold [&_span]:text-muted">
              <span>{t('Your trainer name', 'Nome de treinador')}</span>
              <input
                value={name}
                maxLength={16}
                placeholder={t('Player', 'Treinador')}
                onChange={(e) => onNameChange(e.target.value)}
              />
            </label>
            <div className="guest-id grid gap-1 rounded-lg bg-panel-muted px-[11px] py-[5px] [&_span]:text-[.72rem] [&_span]:text-muted [&_strong]:[letter-spacing:.04em] [&_strong]:[font:700_.85rem_ui-monospace,monospace]">
              <span>{t('Guest ID', 'ID de convidado')}</span>
              <strong>{guest.id}</strong>
            </div>
          </div>
          <fieldset className="avatar-picker mx-0 mt-3 mb-0 min-w-0 border-0 p-0 [&_legend]:mb-1.5 [&_legend]:text-[.82rem] [&_legend]:font-bold">
            <legend>{t('Choose your trainer', 'Escolha seu treinador')}</legend>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(53px,1fr))] gap-[5px]">
              {avatars.map((avatar) => (
                <div
                  className="avatar-profile relative [&_.avatar-choice]:block [&_.lore-anchor]:absolute [&_.lore-anchor]:top-[3px] [&_.lore-anchor]:right-[3px] [&_.lore-trigger]:h-5 [&_.lore-trigger]:w-[19px] [&_.lore-trigger]:text-brand [&:focus-within_.lore-popover]:grid [&:focus-within_.lore-popover]:gap-[3px] [&:hover_.lore-popover]:grid [&:hover_.lore-popover]:gap-[3px] [&:nth-child(n+5)_.lore-popover]:right-0 [&:nth-child(n+5)_.lore-popover]:left-auto compact-layout:[&:nth-child(n+5)_.lore-popover]:fixed compact-layout:[&:nth-child(n+5)_.lore-popover]:[inset:auto_16px_16px] compact-layout:[&:nth-child(n+5)_.lore-popover]:w-auto"
                  key={avatar.id}
                >
                  <label className="avatar-choice relative cursor-pointer [&_img]:object-contain [&_img]:[image-rendering:pixelated] [&_input]:absolute [&_input]:h-[1px] [&_input]:w-[1px] [&_input]:[opacity:0] [&_input:checked_+_span]:border-[color:#a97011] [&_input:checked_+_span]:bg-[#fff3b3] dark:[&_input:checked_+_span]:bg-[#493e31] [&_input:focus-visible_+_span]:[outline:2px_solid_var(--blue)] [&_input:focus-visible_+_span]:[outline-offset:2px] [&_span]:grid [&_span]:justify-items-center [&_span]:gap-0.5 [&_span]:rounded-[9px] [&_span]:[padding:3px] [&_span]:text-[.68rem] [&_span]:font-bold [&_span]:[border:1px_solid_var(--line)]">
                    <input
                      type="radio"
                      name="avatar"
                      checked={guest.avatar === avatar.id}
                      onChange={() => onAvatarChange(avatar.id)}
                    />
                    <span>
                      <Image
                        src={avatarSprite(avatar.id)}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        loading="eager"
                      />
                      {avatar.name}
                    </span>
                  </label>
                  <AvatarLore
                    name={avatar.name}
                    entry={protagonists[avatar.id]}
                    portrait={avatarSprite(avatar.id)}
                  />
                </div>
              ))}
            </div>
          </fieldset>
        </section>
        <div className="mx-0 my-3.5 flex flex-wrap justify-center gap-3">
          <Button tone="primary" size="large" onClick={() => onStart('random')}>
            {t('Play as guest', 'Jogar como convidado')}
          </Button>
          <Button size="large" onClick={onLobby}>
            {t('Rooms & tournaments', 'Salas e torneios')}
          </Button>
          <Button size="large" onClick={() => onStart('daily')}>
            {t('Daily challenge', 'Desafio diário')}
            {stats.dailyBest[today] !== undefined && (
              <span className="chip rounded-full bg-[#18244a15] px-2 py-0.5 text-[.75rem] dark:bg-[#13192a]">
                {t('best', 'melhor')} {stats.dailyBest[today]}/7
              </span>
            )}
          </Button>
        </div>
        <p className="text-[.82rem] text-muted">
          {t(
            'Progress is saved in this browser.',
            'Seu progresso fica salvo neste navegador.',
          )}
        </p>
      </section>

      <section className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
        <Card>
          <h3>{t('How it works', 'Como jogar')}</h3>
          <ol className="steps m-0 list-decimal pl-5 text-muted [&_b]:text-ink [&_li]:[margin:6px_0]">
            <li>
              {t(
                `Each roll shows ${OPTIONS_PER_ROLL} Pokémon based on a region and type, including wildcards.`,
                `Cada sorteio oferece ${OPTIONS_PER_ROLL} Pokémon de acordo com uma região e um tipo, incluindo opções coringa.`,
              )}
            </li>
            <li>
              {t(
                `Use your ${REROLLS_PER_RUN} rerolls to change the type, the region, or both.`,
                `Use suas ${REROLLS_PER_RUN} tentativas para sortear novamente o tipo, a região ou ambos.`,
              )}
            </li>
            <li>
              {t(
                `Catch one per roll until your team of ${TEAM_SIZE} is complete.`,
                `Capture um por sorteio até completar a equipe de ${TEAM_SIZE}.`,
              )}
            </li>
            <li>
              {t(
                'Reorder your team before every match.',
                'Reordene sua equipe antes de cada partida.',
              )}
            </li>
            <li>
              {t(
                'Battles are automatic. Type advantages matter.',
                'As batalhas são automáticas. Aproveite as vantagens de tipo.',
              )}
            </li>
          </ol>
        </Card>
        <Card>
          <h3>{t('Your record', 'Seu histórico')}</h3>
          <div className="record flex gap-3 phone:gap-1.5 [&_>_div]:[flex:1] [&_>_div]:rounded-[10px] [&_>_div]:bg-panel-muted [&_>_div]:[padding:14px] [&_>_div]:text-center phone:[&_>_div]:[padding:8px] [&_b]:block [&_b]:text-[1.6rem] [&_span]:text-[.8rem] [&_span]:text-muted">
            <div>
              <b>{stats.runs}</b>
              <span>{t('runs', 'campanhas')}</span>
            </div>
            <div>
              <b>{stats.best}/7</b>
              <span>{t('best', 'melhor')}</span>
            </div>
            <div>
              <b>{stats.perfect}</b>
              <span>{t('perfect 7–0', 'invicto 7–0')}</span>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
