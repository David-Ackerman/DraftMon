import Image from 'next/image'
import { HudTag } from '../ui/HudTag'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { gameData } from '@draftmon/content'
import { displayName, typesOf } from '@draftmon/engine'
import { BattleView } from '../battle/BattleView'
import { LineupControls } from '../battle/LineupControls'
import { useBattleOrder } from '../battle/useBattleOrder'
import { Sprite } from '../pokemon/Sprite'
import { TypeBadge } from '../pokemon/TypeBadge'
import { Draft } from '../draft/Draft'
import { PartySlots } from './PartySlots'
import { avatars, avatarSprite } from '../../services/guest'
import { useLanguage } from '../../services/language'
import type {
  Replay,
  TournamentMember,
  TournamentState,
} from '../../features/tournament/models'

type Participant = TournamentState['participants'][number]

const portraitOf = (member: TournamentMember) =>
  member.bot ? member.avatar : avatarSprite(member.avatar)

function Portrait({
  member,
  size = 44,
  className = '',
}: {
  member: TournamentMember
  size?: number
  className?: string
}) {
  return (
    <Image
      src={portraitOf(member)}
      width={size}
      height={size}
      alt=""
      unoptimized
      loading="eager"
      className={cn('object-contain [image-rendering:pixelated]', className)}
    />
  )
}

function TeamBanner({
  member,
  side,
  children,
}: {
  member: Participant
  side: 'you' | 'rival'
  children: ReactNode
}) {
  const { t } = useLanguage()
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border-3 border-outline">
      <div
        className={cn(
          'flex items-center gap-2.5 px-3 py-1.5 text-white',
          side === 'you' ? 'bg-[#2a75bb]' : 'bg-[#dc3445]',
        )}
      >
        <Portrait member={member} size={38} />
        <strong className="truncate text-[1.05rem] font-black">
          {member.name}
        </strong>
        <span className="ml-auto font-pixel text-[.6rem] whitespace-nowrap">
          {member.wins} {t('W', 'V')}
        </span>
      </div>
      <div className="bg-panel-muted p-2.5">{children}</div>
    </div>
  )
}

function VsBall() {
  return (
    <div
      aria-hidden="true"
      className="grid size-16 shrink-0 place-items-center self-center rounded-full border-3 border-outline bg-[linear-gradient(#dc3445_0_47%,#14204a_47%_53%,#fff_53%)] shadow-[0_4px_0_var(--outline)] max-md:size-12"
    >
      <span className="grid size-7.5 place-items-center rounded-full border-3 border-outline bg-white font-display text-[.75rem] text-[#14204a] max-md:size-6 max-md:text-[.6rem]">
        VS
      </span>
    </div>
  )
}

function Lineup({
  team,
  busy,
  submit,
  self,
  rival,
}: {
  team: string[]
  busy: boolean
  submit: (order: string[]) => void
  self?: Participant
  rival?: Participant
}) {
  const { t } = useLanguage()
  const { order, move } = useBattleOrder(team)
  const rivalTeam = rival?.team ?? []

  return (
    <Card
      as="section"
      className="tournament-lineup grid gap-4 [&_.order-arrows]:ml-auto [&_.order-item]:cursor-default [&_.order-item]:flex-wrap"
    >
      <h2 className="m-0 inline-flex items-center gap-2.5">
        <Image src="/pokeball.svg" width={28} height={28} alt="" />
        {t('Your match', 'Sua partida')}
      </h2>
      {self && rival && (
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 max-md:grid-cols-1">
          <TeamBanner member={self} side="you">
            <PartySlots
              team={order}
              numbered
              label={t('Your battle order', 'Sua ordem de batalha')}
            />
          </TeamBanner>
          <VsBall />
          <TeamBanner member={rival} side="rival">
            <PartySlots
              team={rivalTeam}
              label={`${t('Party of', 'Equipe de')} ${rival.name}`}
            />
          </TeamBanner>
        </div>
      )}
      {rival && (
        <p className="m-0 rounded-xl border-2 border-line bg-panel-muted px-3.5 py-2.5 text-[.9rem] font-extrabold">
          {t(
            `${rival.name}'s party is revealed after the draft. Their battle order stays secret until the match.`,
            `A equipe de ${rival.name} é revelada após a captura. A ordem de batalha fica em segredo até a partida.`,
          )}
        </p>
      )}
      <div>
        <h3>{t('Your battle order', 'Sua ordem de batalha')}</h3>
        <ol className="mx-0 mt-2 mb-0 grid list-none gap-2 p-0">
          {order.map((name, index) => {
            const pokemon = gameData.pokemonByName.get(name)!
            return (
              <li
                className="order-item flex cursor-grab items-center gap-2.5 rounded-xl border-2 border-line bg-panel-muted px-2.5 py-2 [&.dragging]:[opacity:.5] [&:first-child]:border-outline [&:first-child_.order-num]:text-[color:var(--red)]"
                key={name}
              >
                <span className="order-num w-9.5 text-center font-pixel text-[.7rem] text-muted">
                  {index + 1}
                </span>
                <Sprite pokemon={pokemon} size={40} />
                <strong className="font-black">{displayName(name)}</strong>
                <div className="flex flex-wrap gap-[5px]">
                  {typesOf(pokemon).map((type) => (
                    <TypeBadge key={type} type={type} small />
                  ))}
                </div>
                <LineupControls
                  index={index}
                  length={order.length}
                  busy={busy}
                  move={move}
                  className="ml-auto"
                />
              </li>
            )
          })}
        </ol>
      </div>
      <Button
        tone="primary"
        size="large"
        className="justify-self-end max-md:justify-self-stretch"
        disabled={busy}
        onClick={() => submit(order)}
      >
        <Image src="/pokeball.svg" width={24} height={24} alt="" />
        {t('Ready for battle', 'Pronto para batalhar')}
      </Button>
    </Card>
  )
}

function PhaseTrack({ phase }: { phase: TournamentState['phase'] }) {
  const { t } = useLanguage()
  const steps = [
    { id: 'draft', label: t('Draft', 'Captura') },
    { id: 'groups', label: t('Groups', 'Grupos') },
    { id: 'knockout', label: t('Knockout', 'Eliminatória') },
    { id: 'complete', label: t('Champion', 'Campeão') },
  ] as const
  const current = steps.findIndex(({ id }) => id === phase)
  return (
    <ol
      aria-label={t('Tournament phases', 'Fases do torneio')}
      className="m-0 flex list-none flex-wrap gap-1.5 p-0"
    >
      {steps.map(({ id, label }, index) => (
        <li
          key={id}
          aria-current={index === current ? 'step' : undefined}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border-2 py-1 pr-3 pl-1.5 text-[.8rem] font-black',
            index === current
              ? 'border-outline bg-accent text-accent-ink'
              : index < current
                ? 'border-outline bg-panel-muted'
                : 'border-line text-muted',
          )}
        >
          <Image
            src="/pokeball.svg"
            width={20}
            height={20}
            alt=""
            className={cn(index > current && 'opacity-40 grayscale')}
          />
          {label}
        </li>
      ))}
    </ol>
  )
}

export function Tournament({
  play,
  selfId,
  busy,
  act,
  watch,
}: {
  play: TournamentState
  selfId: string
  busy: boolean
  act: (action: string, body: object) => Promise<boolean>
  watch: (round: number, slot: number) => void
}) {
  const { t } = useLanguage()
  const { phase, self, rounds, ready, champion, participants } = play
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!play.deadlineAt) return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [play.deadlineAt])
  const seconds = play.deadlineAt
    ? Math.max(0, Math.ceil((play.deadlineAt - now) / 1000))
    : null
  const expired = seconds === 0
  const memberById = (id: string) =>
    participants.find((member) => member.id === id)
  const memberName = (id: string) => memberById(id)?.name ?? id
  const teamOf = (id: string) =>
    id === selfId ? self.team : (memberById(id)?.team ?? [])
  const activeRound = rounds.at(-1)
  const myMatch = activeRound?.matches.find(
    ({ left, right }) => right && (left === selfId || right === selfId),
  )
  const rivalId = myMatch
    ? myMatch.left === selfId
      ? myMatch.right
      : myMatch.left
    : null
  const label = {
    draft: t('Private draft', 'Captura privada'),
    groups: t('Group stage', 'Fase de grupos'),
    knockout: t('Knockout stage', 'Fase eliminatória'),
    complete: t('Tournament complete', 'Torneio encerrado'),
  }[phase]
  const showGroupWins = rounds.some((round) => round.type === 'groups')

  return (
    <div className="grid gap-5">
      <Card
        as="section"
        className="tournament-scoreboard flex flex-wrap items-center justify-between gap-4"
      >
        <div className="grid gap-1">
          <span className="text-[.78rem] font-black tracking-[.08em] text-muted uppercase">
            {participants.length} {t('trainers', 'treinadores')}
          </span>
          <h2 className="m-0 text-[clamp(1.8rem,4vw,2.6rem)]">{label}</h2>
        </div>
        <PhaseTrack phase={phase} />
        {seconds !== null && (
          <p className="m-0 grid justify-items-center gap-1 rounded-xl bg-[#14204a] px-4 py-2 text-[#ffcb05] shadow-[inset_0_0_0_2px_#ffcb05]">
            <span className="text-[.68rem] font-black text-[#dfe6fb] uppercase">
              {t('Time left', 'Tempo restante')}
            </span>
            <time className="font-pixel text-[1.4rem] leading-none">
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
            </time>
          </p>
        )}
        {champion && (
          <p className="m-0 inline-flex basis-full items-center gap-2 rounded-xl border-3 border-outline bg-accent px-3.5 py-2 font-display text-[1.2rem] text-accent-ink">
            <Image src="/masterball.svg" width={26} height={26} alt="" />
            {t('Champion', 'Campeão')} · {memberName(champion)}
          </p>
        )}
        {phase === 'complete' && !champion && (
          <p className="m-0 basis-full">
            {t(
              'The tournament ended without a champion.',
              'O torneio terminou sem campeão.',
            )}
          </p>
        )}
      </Card>
      {expired && (
        <Card as="p" role="status">
          {t(
            'Time is up. Filling in missing choices…',
            'Prazo encerrado. Sorteando as escolhas que faltam…',
          )}
        </Card>
      )}
      {!expired &&
        phase === 'draft' &&
        (self.roll ? (
          <Draft
            key={self.team.length}
            run={self}
            onPick={(pokemon) =>
              act('catch', {
                pokemon,
                pick: self.team.length,
                rerolls: self.rerollsLeft,
              })
            }
            onReroll={(mode) =>
              act('reroll', {
                mode,
                pick: self.team.length,
                rerolls: self.rerollsLeft,
              })
            }
          />
        ) : (
          <Card as="p" role="status">
            {t(
              'Waiting for the other players to finish drafting.',
              'Aguardando os outros jogadores concluírem suas capturas.',
            )}
          </Card>
        ))}
      {!expired &&
        (phase === 'groups' || phase === 'knockout') &&
        (myMatch && !ready ? (
          <Lineup
            key={rounds.length}
            team={self.team}
            busy={busy}
            self={memberById(selfId)}
            rival={rivalId ? memberById(rivalId) : undefined}
            submit={(order) => {
              void act('ready', { round: rounds.length - 1, order })
            }}
          />
        ) : (
          <Card as="p" role="status">
            {myMatch
              ? t(
                  'Lineup submitted. Waiting for the round.',
                  'Ordem enviada. Aguardando a rodada.',
                )
              : t(
                  'You have no match in the current round.',
                  'Você não tem partida nesta rodada.',
                )}
          </Card>
        ))}
      <section className="grid gap-3">
        <h2 className="m-0">
          {t('Trainers & parties', 'Treinadores e equipes')}
        </h2>
        <ul className="tournament-participants m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4 p-0">
          {participants.map((member) => {
            const isSelf = member.id === selfId
            const out =
              phase !== 'draft' &&
              phase !== 'complete' &&
              rounds.at(-1)?.type === 'knockout' &&
              !rounds
                .at(-1)!
                .matches.some(
                  ({ left, right }) =>
                    left === member.id || right === member.id,
                )
            return (
              <li
                key={member.id}
                className={cn(
                  'grid gap-3 rounded-[18px] border-3 border-outline bg-panel p-3.5 shadow-[4px_4px_0_var(--outline)]',
                  out && 'opacity-70',
                )}
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={cn(
                      'grid size-13 shrink-0 place-items-center rounded-xl border-2 border-outline',
                      isSelf
                        ? 'bg-[#2a75bb]'
                        : member.id === rivalId
                          ? 'bg-[#dc3445]'
                          : 'bg-panel-muted',
                    )}
                  >
                    <Portrait member={member} size={42} />
                  </span>
                  <div className="grid min-w-0 gap-0.5">
                    <strong className="truncate font-black">
                      {member.name}
                      {isSelf && ` (${t('you', 'você')})`}
                    </strong>
                    {showGroupWins && (
                      <span className="font-pixel text-[.6rem] text-muted">
                        {member.wins} {t('wins', 'vitórias')}
                      </span>
                    )}
                  </div>
                  <div className="ml-auto flex flex-wrap justify-end gap-1">
                    {member.bot && <HudTag>Bot</HudTag>}
                    {phase === 'draft' && (
                      <HudTag>
                        {member.ready
                          ? t('Ready', 'Pronto')
                          : t('Drafting', 'Capturando')}
                      </HudTag>
                    )}
                    {member.draftForfeit && (
                      <HudTag>{t('Draft forfeit', 'W.O. na captura')}</HudTag>
                    )}
                    {champion === member.id && (
                      <HudTag>{t('Champion', 'Campeão')}</HudTag>
                    )}
                  </div>
                </div>
                <PartySlots
                  team={teamOf(member.id)}
                  label={`${t('Party of', 'Equipe de')} ${member.name}`}
                />
                {phase === 'draft' && !isSelf && (
                  <span className="text-[.75rem] font-bold text-muted">
                    {t(
                      'Parties are revealed when the draft ends.',
                      'As equipes são reveladas ao fim da captura.',
                    )}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </section>
      {rounds.length > 0 && (
        <Card as="section">
          <h2>{t('Matches and replays', 'Partidas e replays')}</h2>
          {rounds.map((round, index) => (
            <section className="mt-3.5" key={index}>
              <h3>
                {round.type === 'groups'
                  ? t('Group stage', 'Fase de grupos')
                  : t('Knockout', 'Eliminatória')}{' '}
                · {t('Round', 'Rodada')} {index + 1}
              </h3>
              {round.matches.map((match, slot) => (
                <div
                  className="tournament-match mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border-2 border-line bg-panel-muted p-2.5"
                  key={slot}
                >
                  <MatchSide
                    name={memberName(match.left)}
                    team={teamOf(match.left)}
                    lost={Boolean(match.winner && match.winner !== match.left)}
                  />
                  {match.right ? (
                    <>
                      <span className="font-display text-[1.1rem] text-[color:var(--red)]">
                        VS
                      </span>
                      <MatchSide
                        name={memberName(match.right)}
                        team={teamOf(match.right)}
                        lost={Boolean(
                          match.winner && match.winner !== match.right,
                        )}
                      />
                    </>
                  ) : (
                    <HudTag>{t('Bye', 'Avança direto')}</HudTag>
                  )}
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    {match.winner && (
                      <HudTag>
                        {memberName(match.winner)}{' '}
                        {match.forfeit
                          ? t('wins by forfeit', 'vence por W.O.')
                          : t('wins', 'vence')}
                      </HudTag>
                    )}
                    {match.forfeit === 'double' && (
                      <HudTag>{t('Double forfeit', 'W.O. duplo')}</HudTag>
                    )}
                    {match.watch && (
                      <Button
                        disabled={busy}
                        onClick={() => watch(index, slot)}
                      >
                        {t('Watch replay', 'Assistir replay')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </Card>
      )}
    </div>
  )
}

function MatchSide({
  name,
  team,
  lost,
}: {
  name: string
  team: string[]
  lost: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-[1_1_240px] flex-wrap items-center gap-1',
        lost && 'opacity-55 grayscale-[.6]',
      )}
    >
      <strong className="mr-1.5 font-black">{name}</strong>
      {team.map((member) => {
        const pokemon = gameData.pokemonByName.get(member)
        return pokemon ? (
          <Sprite key={member} pokemon={pokemon} size={32} />
        ) : null
      })}
    </div>
  )
}

export function TournamentReplay({
  replay,
  onBack,
}: {
  replay: Replay
  onBack: () => void
}) {
  const { left, right, result, level } = replay
  const portrait = (player: TournamentMember) =>
    player.bot ? player.avatar : avatarSprite(player.avatar)
  const trainerId = (player: TournamentMember) =>
    player.bot ? player.id.replace(/^bot-|:\d+$/g, '') : player.avatar
  const avatarId = trainerId(left)
  return (
    <BattleView
      result={result}
      replay
      onDone={onBack}
      playerName={left.name}
      playerSprite={portrait(left)}
      playerAvatar={{
        id: avatarId,
        name: avatars.find(({ id }) => id === avatarId)?.name ?? left.name,
      }}
      opponentAvatar={right.bot ? undefined : right.avatar}
      match={{
        stage: '',
        level,
        trainer: {
          id: right.bot ? trainerId(right) : right.id,
          name: right.name,
          title: '',
          tier: 1,
          sprite: portrait(right),
          pokemon: [],
        },
      }}
    />
  )
}
