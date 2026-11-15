import Image from 'next/image'
import { HudTag } from '../ui/HudTag'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useEffect, useState } from 'react'
import { gameData } from '@draftmon/content'
import { displayName, typesOf } from '@draftmon/engine'
import { BattleView } from '../battle/BattleView'
import { LineupControls } from '../battle/LineupControls'
import { useBattleOrder } from '../battle/useBattleOrder'
import { Sprite } from '../pokemon/Sprite'
import { TypeBadge } from '../pokemon/TypeBadge'
import { Draft } from '../draft/Draft'
import { avatars, avatarSprite } from '../../services/guest'
import { useLanguage } from '../../services/language'
import type {
  Replay,
  TournamentMember,
  TournamentState,
} from '../../features/tournament/models'

function Lineup({
  team,
  busy,
  submit,
}: {
  team: string[]
  busy: boolean
  submit: (order: string[]) => void
}) {
  const { t } = useLanguage()
  const { order, move } = useBattleOrder(team)

  return (
    <Card
      as="section"
      className="tournament-lineup [&_.order-arrows]:ml-auto [&_.order-item]:cursor-default [&_.order-item]:flex-wrap"
    >
      <h2>{t('Your battle order', 'Sua ordem de batalha')}</h2>
      <ol className="mx-0 mt-2 mb-3.5 grid list-none gap-2 p-0">
        {order.map((name, index) => {
          const pokemon = gameData.pokemonByName.get(name)!
          return (
            <li
              className="order-item flex cursor-grab items-center gap-2.5 rounded-xl border border-line bg-panel-muted px-2.5 py-2 [&.dragging]:[opacity:.5] [&:first-child]:border-brand [&:first-child_.order-num]:text-brand"
              key={name}
            >
              <span className="order-num w-9.5 text-center text-[.8rem] font-extrabold text-muted">
                {index + 1}
              </span>
              <Sprite pokemon={pokemon} size={40} />
              <strong>{displayName(name)}</strong>
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
      <Button tone="primary" disabled={busy} onClick={() => submit(order)}>
        {t('Ready for battle', 'Pronto para batalhar')}
      </Button>
    </Card>
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
  const memberName = (id: string) =>
    participants.find((member) => member.id === id)?.name ?? id
  const activeRound = rounds.at(-1)
  const myMatch = activeRound?.matches.find(
    ({ left, right }) => right && (left === selfId || right === selfId),
  )
  const label = {
    draft: t('Private draft', 'Captura privada'),
    groups: t('Group stage', 'Fase de grupos'),
    knockout: t('Knockout stage', 'Fase eliminatória'),
    complete: t('Tournament complete', 'Torneio encerrado'),
  }[phase]

  return (
    <>
      <Card as="section" className="tournament-scoreboard">
        <h2>{label}</h2>
        {seconds !== null && (
          <HudTag as="p">
            {t('Time left', 'Tempo restante')} ·{' '}
            <time>
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
            </time>
          </HudTag>
        )}
        <ul className="tournament-participants m-0 flex list-none flex-wrap gap-1.5 p-0 [&_img]:[image-rendering:pixelated] [&_li]:flex [&_li]:items-center [&_li]:gap-[5px] [&_li]:rounded-[8px] [&_li]:bg-panel-muted [&_li]:[padding:3px_8px]">
          {participants.map((member) => (
            <li key={member.id}>
              <Image
                src={member.bot ? member.avatar : avatarSprite(member.avatar)}
                width={35}
                height={35}
                alt=""
                unoptimized
                loading="eager"
              />
              <strong>{member.name}</strong>
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
              {rounds.some((round) => round.type === 'groups') && (
                <HudTag>
                  {member.wins} {t('wins', 'vitórias')}
                </HudTag>
              )}
            </li>
          ))}
        </ul>
        {champion && (
          <HudTag as="p">
            {t('Champion', 'Campeão')} · {memberName(champion)}
          </HudTag>
        )}
        {phase === 'complete' && !champion && (
          <p>
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
                  className="tournament-match mt-1.5 flex flex-wrap items-center gap-2 rounded-lg bg-panel-muted p-2 [&_strong]:[flex:1_1_130px]"
                  key={slot}
                >
                  <strong>
                    {memberName(match.left)}
                    {match.right
                      ? ` vs ${memberName(match.right)}`
                      : t(' · Bye', ' · Avança direto')}
                  </strong>
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
                    <Button disabled={busy} onClick={() => watch(index, slot)}>
                      {t('Watch replay', 'Assistir replay')}
                    </Button>
                  )}
                </div>
              ))}
            </section>
          ))}
        </Card>
      )}
    </>
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
  const avatarId = left.id.startsWith('bot-') ? left.id.slice(4) : left.avatar
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
          id: right.id.replace(/^bot-/, ''),
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
