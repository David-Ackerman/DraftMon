import Image from 'next/image'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { cn } from '../components/ui/cn'
import {
  LEAGUE_MATCHES,
  OPTIONS_PER_ROLL,
  REROLLS_PER_RUN,
  TEAM_SIZE,
} from '@draftmon/engine'
import type { PlayerStats } from '../services/storage'
import { Showcase } from '../components/pokemon/Showcase'
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
  const dailyBest = stats.dailyBest[today]
  const steps = [
    t(
      `Each roll shows ${OPTIONS_PER_ROLL} Pokémon based on a region and type, including wildcards.`,
      `Cada sorteio oferece ${OPTIONS_PER_ROLL} Pokémon de acordo com uma região e um tipo, incluindo opções coringa.`,
    ),
    t(
      `Use your ${REROLLS_PER_RUN} rerolls to change the type, the region, or both.`,
      `Use suas ${REROLLS_PER_RUN} tentativas para sortear novamente o tipo, a região ou ambos.`,
    ),
    t(
      `Catch one per roll until your team of ${TEAM_SIZE} is complete.`,
      `Capture um por sorteio até completar a equipe de ${TEAM_SIZE}.`,
    ),
    t(
      'Reorder your team before every match.',
      'Reordene sua equipe antes de cada partida.',
    ),
    t(
      'Battles are automatic. Type advantages matter.',
      'As batalhas são automáticas. Aproveite as vantagens de tipo.',
    ),
  ]
  const record = [
    {
      value: String(stats.runs),
      label: t('Runs', 'Campanhas'),
      tone: 'text-[#2a75bb] dark:text-[#8cc0ff]',
      gold: false,
    },
    {
      value: `${stats.best}/${LEAGUE_MATCHES}`,
      label: t('Best', 'Melhor'),
      tone: 'text-[color:var(--red)]',
      gold: false,
    },
    {
      value: String(stats.perfect),
      label: t('Perfect 7–0', 'Invicto 7–0'),
      tone: '',
      gold: true,
    },
  ]

  return (
    <div className="home grid gap-6">
      <Card
        as="section"
        className="flex flex-wrap gap-6 p-8 phone:p-5"
        aria-labelledby="home-title"
      >
        <div className="flex min-w-0 flex-[999_1_420px] flex-col items-start gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-outline bg-accent px-3 py-1 text-[.78rem] font-black text-accent-ink uppercase">
            <Image src="/pokeball.svg" width={18} height={18} alt="" />
            {t(
              `${LEAGUE_MATCHES} battles to a perfect run`,
              `${LEAGUE_MATCHES} batalhas para uma campanha perfeita`,
            )}
          </span>
          <h1 id="home-title" className="m-0">
            {t('Build your Pokémon team.', 'Monte sua equipe Pokémon.')}
          </h1>
          <p className="m-0 max-w-140 text-[1.1rem] font-bold text-muted">
            {t(
              `Catch Pokémon by region and type, then take your team of ${TEAM_SIZE} into a ${LEAGUE_MATCHES}-match league against Gym Leaders, Elite Four members and Champions. One loss ends the run.`,
              `Capture Pokémon por região e tipo e leve sua equipe de ${TEAM_SIZE} a uma liga de ${LEAGUE_MATCHES} partidas contra Líderes de Ginásio, a Elite dos Quatro e Campeões. Uma derrota encerra a campanha.`,
            )}
          </p>
          <div className="mt-1 flex flex-wrap gap-3.5 phone:w-full phone:[&_.btn]:flex-[1_1_100%]">
            <Button
              tone="primary"
              size="large"
              onClick={() => onStart('random')}
            >
              <Image src="/pokeball.svg" width={26} height={26} alt="" />
              {t('Play as guest', 'Jogar como convidado')}
            </Button>
            <Button tone="secondary" size="large" onClick={onLobby}>
              {t('Rooms & tournaments', 'Salas e torneios')}
            </Button>
            <Button size="large" onClick={() => onStart('daily')}>
              {t('Daily challenge', 'Desafio diário')}
              {dailyBest !== undefined && (
                <span className="rounded-lg bg-[#3fbf5f] px-2 py-0.5 font-sans text-[.78rem] font-black text-[#06210f]">
                  {t('BEST', 'MELHOR')} {dailyBest}/{LEAGUE_MATCHES}
                </span>
              )}
            </Button>
          </div>
          <p className="m-0 text-[.82rem] text-muted">
            {t(
              'Progress is saved in this browser.',
              'Seu progresso fica salvo neste navegador.',
            )}
          </p>
        </div>
        <Showcase className="flex-[1_1_300px]" />
      </Card>

      <Card
        as="section"
        className="flex flex-wrap items-end gap-6"
        aria-label={t('Guest trainer profile', 'Perfil de treinador convidado')}
      >
        <label className="field-label flex-[1_1_220px]">
          {t('Your trainer name', 'Nome de treinador')}
          <input
            className="field"
            value={name}
            maxLength={16}
            placeholder={t('Player', 'Treinador')}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </label>
        <fieldset className="avatar-picker m-0 min-w-0 flex-[2_1_380px] border-0 p-0">
          <legend className="field-label mb-1.5">
            {t('Choose your trainer', 'Escolha seu treinador')}
          </legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(58px,1fr))] gap-1.5">
            {avatars.map((avatar) => (
              <div
                className="avatar-profile relative [&_.lore-anchor]:absolute [&_.lore-anchor]:top-1 [&_.lore-anchor]:right-1 [&_.lore-trigger]:h-5 [&_.lore-trigger]:w-[19px] [&_.lore-trigger]:text-brand [&:focus-within_.lore-popover]:grid [&:focus-within_.lore-popover]:gap-[3px] [&:hover_.lore-popover]:grid [&:hover_.lore-popover]:gap-[3px] [&:nth-child(n+5)_.lore-popover]:right-0 [&:nth-child(n+5)_.lore-popover]:left-auto compact-layout:[&:nth-child(n+5)_.lore-popover]:fixed compact-layout:[&:nth-child(n+5)_.lore-popover]:[inset:auto_16px_16px] compact-layout:[&:nth-child(n+5)_.lore-popover]:w-auto"
                key={avatar.id}
              >
                <label className="avatar-choice block cursor-pointer">
                  <input
                    type="radio"
                    name="avatar"
                    className="peer sr-only"
                    checked={guest.avatar === avatar.id}
                    onChange={() => onAvatarChange(avatar.id)}
                  />
                  <span className="grid justify-items-center gap-0.5 rounded-xl border-2 border-outline bg-panel-muted p-1 text-[.68rem] font-black peer-checked:border-[#ffcb05] peer-checked:bg-[#ffcb0540] peer-checked:shadow-[0_0_0_2px_#ffcb05] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2a75bb]">
                    <Image
                      src={avatarSprite(avatar.id)}
                      alt=""
                      width={44}
                      height={44}
                      unoptimized
                      loading="eager"
                      className="object-contain [image-rendering:pixelated]"
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
        <div className="field-label flex-[0_1_auto]">
          {t('Guest ID', 'ID de convidado')}
          <span className="field flex items-center font-pixel text-[.7rem] tracking-normal text-ink normal-case">
            {guest.id}
          </span>
        </div>
      </Card>

      <Card as="section" className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="m-0 text-[1.9rem]">
            {t('Road to Champion', 'Rumo ao título')}
          </h2>
          <span className="font-extrabold text-muted">
            {t(
              `Best run ${stats.best}/${LEAGUE_MATCHES} · ${stats.runs} runs · ${stats.perfect} perfect`,
              `Melhor ${stats.best}/${LEAGUE_MATCHES} · ${stats.runs} campanhas · ${stats.perfect} invictas`,
            )}
          </span>
        </div>
        <ol className="m-0 grid list-none grid-cols-7 gap-2.5 p-0 phone:gap-1">
          {Array.from({ length: LEAGUE_MATCHES }, (_, index) => {
            const state =
              index < stats.best
                ? 'cleared'
                : index === stats.best
                  ? 'next'
                  : 'locked'
            return (
              <li
                key={index}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border-3 px-1.5 py-3.5 phone:rounded-xl phone:border-2 phone:py-2',
                  state === 'cleared' && 'border-outline bg-panel-muted',
                  state === 'next' && 'border-[#ffcb05]',
                  state === 'locked' && 'border-dashed border-line',
                )}
              >
                <Image
                  src="/pokeball.svg"
                  width={44}
                  height={44}
                  alt=""
                  className={cn(
                    'size-11 phone:size-7',
                    state === 'locked' && 'opacity-35 grayscale',
                  )}
                />
                <span className="font-display text-base phone:hidden">
                  {t('Battle', 'Batalha')} {index + 1}
                </span>
                <span
                  className={cn(
                    'text-[.68rem] font-black uppercase phone:sr-only',
                    state === 'cleared'
                      ? 'text-[color:var(--good)]'
                      : 'text-muted',
                  )}
                >
                  {state === 'cleared'
                    ? t('Cleared', 'Vencida')
                    : state === 'next'
                      ? t('Next', 'Próxima')
                      : t('Locked', 'Bloqueada')}
                </span>
              </li>
            )
          })}
        </ol>
      </Card>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-6">
        <Card className="grid content-start gap-3">
          <h2 className="m-0">{t('How it works', 'Como jogar')}</h2>
          <ol className="m-0 grid list-none gap-2.5 p-0">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3 font-extrabold">
                <span
                  aria-hidden="true"
                  className="grid size-8.5 shrink-0 place-items-center rounded-full border-3 border-outline bg-[#dc3445] font-display text-white"
                >
                  {index + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="grid content-start gap-3">
          <h2 className="m-0">{t('Your record', 'Seu histórico')}</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {record.map(({ value, label, tone, gold }) => (
              <div
                key={label}
                className={cn(
                  'grid justify-items-center gap-2 rounded-2xl border-3 border-outline px-1 py-4 text-center',
                  gold ? 'bg-accent text-accent-ink' : 'bg-panel-muted',
                )}
              >
                <b
                  className={cn(
                    'font-pixel text-[1.25rem] font-normal phone:text-base',
                    tone,
                  )}
                >
                  {value}
                </b>
                <span
                  className={cn(
                    'text-[.75rem] font-black uppercase',
                    !gold && 'text-muted',
                  )}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
