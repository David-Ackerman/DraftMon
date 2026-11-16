import Image from 'next/image'
import { HudTag } from '../components/ui/HudTag'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useLanguage } from '../services/language'
import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  DEFAULT_TOURNAMENT_PLAYERS,
  MIN_TOURNAMENT_PLAYERS,
  ROOM_PLAYER_LIMIT,
  tournamentBotCount,
  tournamentHumanLimit,
} from '@draftmon/contracts'
import { avatars, avatarSprite } from '../services/guest'
import type { Guest } from '../services/guest'
import { LoreCard } from '../components/pokemon/LoreCard'
import { protagonists } from '../components/pokemon/lore'
import {
  Tournament,
  TournamentReplay,
} from '../components/tournament/Tournament'
import type { Room } from '../features/tournament/roomApi'
import { useLobbyRoom } from '../features/tournament/useLobbyRoom'

const errors: Record<string, string> = {
  'Request is too large.': 'O pedido é grande demais.',
  'Invalid request data.': 'Dados inválidos.',
  'Guest profile required.': 'É necessário um perfil de convidado.',
  'Choose a valid trainer portrait.': 'Escolha um retrato de treinador válido.',
  'Room not found.': 'Sala não encontrada.',
  'Enter a name and choose a room type.':
    'Digite um nome e escolha o tipo de sala.',
  'Room not found. Check the invite code.':
    'Sala não encontrada. Confira o código de convite.',
  'This tournament has already started.': 'Este torneio já começou.',
  'This room is full.': 'Esta sala está cheia.',
  'Guest ID already in use.': 'Este ID de convidado já está em uso.',
  'Only the host can start the tournament.':
    'Apenas o anfitrião pode iniciar o torneio.',
  'This tournament cannot be started.': 'Não é possível iniciar este torneio.',
  'At least two guests must join.':
    'A sala precisa de pelo menos dois convidados.',
  'Only the host can record results.':
    'Apenas o anfitrião pode registrar resultados.',
  'This match cannot accept that result.':
    'Esta partida não aceita esse resultado.',
  'Room action not found.': 'Ação indisponível para esta sala.',
  'Join the room first.': 'Entre na sala primeiro.',
  'The lobby could not save or load that request.':
    'O lobby não conseguiu concluir a operação.',
  'The lobby server is unavailable.': 'O servidor do lobby está indisponível.',
  'Invalid tournament settings.': 'Configurações do torneio inválidas.',
  'At least two participants are required.':
    'São necessários pelo menos dois participantes.',
  'This draft offer has changed.': 'As opções de captura mudaram.',
  'Choose a Pokémon from your current offer.':
    'Escolha um Pokémon da lista atual.',
  'This reroll is unavailable.': 'Não é possível sortear novamente.',
  'This tournament round has changed.': 'A rodada do torneio mudou.',
  'The tournament engine is unavailable.':
    'O motor do torneio está indisponível.',
  'Replay not available.': 'Replay indisponível.',
  default: 'Não foi possível conectar à sala.',
}

export function Lobby({
  guest,
  playerName,
  invite,
  onRoomChange,
  onBack,
}: {
  guest: Guest
  playerName: string
  invite: string
  onRoomChange: (code: string) => void
  onBack: () => void
}) {
  const { t } = useLanguage()
  const {
    room,
    replay,
    closeReplay,
    busy,
    error,
    reconnecting,
    execute,
    watchReplay,
  } = useLobbyRoom(guest, invite, onRoomChange)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<Room['kind']>('tournament')
  const [groups, setGroups] = useState(true)
  const [minimumPlayers, setMinimumPlayers] = useState(
    DEFAULT_TOURNAMENT_PLAYERS,
  )
  const [roundMinutes, setRoundMinutes] = useState(10)
  const [code, setCode] = useState(invite)
  const [copyMessage, setCopyMessage] = useState('')
  const profile = { name: playerName, avatar: guest.avatar }

  const create = (event: FormEvent) => {
    event.preventDefault()
    void execute('', {
      ...profile,
      nameOfRoom: name,
      kind,
      groups,
      minimumPlayers,
      roundMinutes,
    })
  }

  const join = (event: FormEvent) => {
    event.preventDefault()
    void execute(`/${code}/join`, profile)
  }

  if (!room)
    return (
      <section className="mx-auto grid max-w-240 gap-3.5">
        <Card
          as="header"
          className="panel-heading flex flex-wrap items-center justify-between gap-3 [&_h1]:[margin:0_0_4px] [&_h1]:text-[clamp(1.55rem,4vw,2.4rem)] [&_h1]:wrap-anywhere [&_p]:m-0"
        >
          <div>
            <h1>{t('League lobby', 'Lobby da Liga')}</h1>
            <p className="text-muted">
              {t(
                'Create a room or join with an invite code.',
                'Crie uma sala ou entre com um código de convite.',
              )}
            </p>
          </div>
          <Button onClick={onBack}>{t('Home', 'Início')}</Button>
        </Card>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-3.5">
          <Card
            as="form"
            className="lobby-form grid content-start gap-3 [&_.tournament-checkbox]:flex [&_.tournament-checkbox]:items-center [&_.tournament-checkbox]:gap-[7px] [&_input]:w-full [&_input]:rounded-[8px] [&_input]:bg-panel [&_input]:[padding:9px] [&_input]:text-ink [&_input]:[border:1px_solid_var(--line)] [&_input]:[font:inherit] [&_label]:grid [&_label]:gap-[3px] [&_label]:text-[.82rem] [&_label]:font-bold [&_select]:w-full [&_select]:rounded-[8px] [&_select]:bg-panel [&_select]:[padding:9px] [&_select]:text-ink [&_select]:[border:1px_solid_var(--line)] [&_select]:[font:inherit]"
            onSubmit={create}
          >
            <h2>{t('Create a room', 'Criar uma sala')}</h2>
            <label>
              {t('Room name', 'Nome da sala')}
              <input
                required
                maxLength={48}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              {t('Format', 'Formato')}
              <select
                value={kind}
                onChange={(e) =>
                  setKind(e.target.value === 'room' ? 'room' : 'tournament')
                }
              >
                <option value="tournament">
                  {t('Friends tournament', 'Torneio entre amigos')}
                </option>
                <option value="room">
                  {t('Guest lobby', 'Sala de convidados')}
                </option>
              </select>
            </label>
            {kind === 'tournament' && (
              <>
                <label className="tournament-checkbox [&_input]:w-auto [&_input]:[accent-color:var(--blue)]">
                  <input
                    type="checkbox"
                    checked={groups}
                    onChange={(event) => setGroups(event.target.checked)}
                  />
                  {t('Include a group stage', 'Incluir fase de grupos')}
                </label>
                <label>
                  {t('Minimum participants', 'Mínimo de participantes')}
                  <select
                    name="minimumPlayers"
                    value={minimumPlayers}
                    onChange={(event) =>
                      setMinimumPlayers(Number(event.target.value))
                    }
                  >
                    {Array.from(
                      {
                        length: ROOM_PLAYER_LIMIT - MIN_TOURNAMENT_PLAYERS + 1,
                      },
                      (_, index) => index + MIN_TOURNAMENT_PLAYERS,
                    ).map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                  <span className="font-normal text-muted">
                    {t(
                      'Bots fill any open spots when you start.',
                      'Os bots completam as vagas que faltarem quando você iniciar.',
                    )}
                  </span>
                </label>
                <label>
                  {t(
                    'Time limit per stage or round',
                    'Prazo por etapa ou rodada',
                  )}
                  <select
                    value={roundMinutes}
                    onChange={(event) =>
                      setRoundMinutes(Number(event.target.value))
                    }
                  >
                    {[5, 10, 15, 30, 60].map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} min
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <Button tone="primary" disabled={busy}>
              {t('Create room', 'Criar sala')}
            </Button>
          </Card>
          <Card
            as="form"
            className="lobby-form grid content-start gap-3 [&_.tournament-checkbox]:flex [&_.tournament-checkbox]:items-center [&_.tournament-checkbox]:gap-[7px] [&_input]:w-full [&_input]:rounded-[8px] [&_input]:bg-panel [&_input]:[padding:9px] [&_input]:text-ink [&_input]:[border:1px_solid_var(--line)] [&_input]:[font:inherit] [&_label]:grid [&_label]:gap-[3px] [&_label]:text-[.82rem] [&_label]:font-bold [&_select]:w-full [&_select]:rounded-[8px] [&_select]:bg-panel [&_select]:[padding:9px] [&_select]:text-ink [&_select]:[border:1px_solid_var(--line)] [&_select]:[font:inherit]"
            onSubmit={join}
          >
            <h2>{t('Join a room', 'Entrar em uma sala')}</h2>
            <label data-report-private>
              {t('Invite code', 'Código de convite')}
              <input
                required
                maxLength={8}
                pattern="[A-F0-9]{8}"
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value.toUpperCase().replace(/[^A-F0-9]/g, ''),
                  )
                }
              />
            </label>
            <Button tone="primary" disabled={busy}>
              {t('Join room', 'Entrar na sala')}
            </Button>
          </Card>
        </div>
        {error && (
          <Card
            as="p"
            compact
            className="m-0 px-4.5 py-2.5 text-danger"
            role="alert"
          >
            {t(error, errors[error] ?? errors.default)}
          </Card>
        )}
      </section>
    )

  const isHost = room.host === room.selfId
  const guestLobby = room.kind === 'room'
  const waitingToStart = !room.play && !room.rounds.length
  const settings = guestLobby
    ? { groups: false, minimumPlayers: DEFAULT_TOURNAMENT_PLAYERS }
    : room.settings
  const botCount = tournamentBotCount(room.members.length, settings)
  const memberName = (id: string) =>
    room.members.find((member) => member.id === id)?.name ?? id
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyMessage('copied')
    } catch {
      setCopyMessage('code')
    }
  }

  return (
    <section className="mx-auto grid max-w-240 gap-3.5">
      <Card
        as="header"
        className="panel-heading flex flex-wrap items-center justify-between gap-3 [&_h1]:[margin:0_0_4px] [&_h1]:text-[clamp(1.55rem,4vw,2.4rem)] [&_h1]:wrap-anywhere [&_p]:m-0"
      >
        <div>
          <h1>{room.name}</h1>
          <HudTag>
            {room.kind === 'tournament'
              ? t('Tournament', 'Torneio')
              : t('Guest lobby', 'Sala de convidados')}
          </HudTag>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onBack}>{t('Home', 'Início')}</Button>
          {waitingToStart && isHost && (
            <Button
              tone="primary"
              disabled={busy}
              onClick={() => execute(`/${room.code}/start`, {})}
            >
              {t('Start tournament', 'Iniciar torneio')}
            </Button>
          )}
        </div>
      </Card>
      <Card className="panel-heading flex flex-wrap items-center justify-between gap-3 [&_h1]:[margin:0_0_4px] [&_h1]:text-[clamp(1.55rem,4vw,2.4rem)] [&_h1]:wrap-anywhere [&_p]:m-0">
        <div
          className="invite-code grid gap-0.5 [&_strong]:[letter-spacing:.1em] [&_strong]:[font:700_1.15rem_ui-monospace,monospace]"
          data-report-private
        >
          <span className="text-[.82rem] text-muted">
            {t('Invite code', 'Código de convite')}
          </span>
          <strong>{room.code}</strong>
        </div>
        <Button onClick={copyInvite}>
          {t('Copy invite link', 'Copiar link do convite')}
        </Button>
        {copyMessage === 'copied' && (
          <span className="text-[.82rem] text-muted" role="status">
            {t('Invite link copied.', 'Link do convite copiado.')}
          </span>
        )}
        {copyMessage === 'code' && (
          <input
            className="w-full rounded-lg border border-line bg-panel-muted p-2 text-ink"
            data-report-private
            aria-label={t('Invite link', 'Link do convite')}
            value={window.location.href}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
        )}
      </Card>
      {(error || reconnecting) && (
        <Card
          as="p"
          compact
          className="m-0 px-4.5 py-2.5 text-danger"
          role="status"
        >
          {error
            ? t(error, errors[error] ?? errors.default)
            : t('Reconnecting to the room…', 'Reconectando à sala…')}
        </Card>
      )}
      {replay ? (
        <TournamentReplay replay={replay} onBack={closeReplay} />
      ) : (
        <>
          {!room.play && (
            <Card>
              <h2>
                {t('Trainers', 'Treinadores')}{' '}
                <HudTag>
                  {room.members.length}/{tournamentHumanLimit(room.settings)}
                </HudTag>
              </h2>
              <ul className="lobby-members m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-[7px] p-0 [&_img]:object-contain [&_img]:[image-rendering:pixelated] [&_li]:flex [&_li]:items-center [&_li]:gap-2 [&_li]:rounded-[8px] [&_li]:bg-panel-muted [&_li]:[padding:5px_8px] [&_small]:block [&_small]:text-muted">
                {room.members.map((member) => (
                  <li key={member.id}>
                    <LoreCard
                      name={
                        avatars.find((avatar) => avatar.id === member.avatar)
                          ?.name ?? member.name
                      }
                      entry={protagonists[member.avatar]}
                      portrait={avatarSprite(member.avatar)}
                    >
                      <Image
                        src={avatarSprite(member.avatar)}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        loading="eager"
                      />
                    </LoreCard>
                    <div>
                      <strong>{member.name}</strong>
                      <small>ID {member.id}</small>
                    </div>
                    {member.id === room.host && (
                      <HudTag>{t('Host', 'Anfitrião')}</HudTag>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {room.play && (
            <Tournament
              play={room.play}
              selfId={room.selfId}
              busy={busy}
              act={(action, body) => execute(`/${room.code}/${action}`, body)}
              watch={watchReplay}
            />
          )}
          {waitingToStart && (!guestLobby || isHost) && (
            <Card>
              <h2>{t('Tournament rules', 'Regras do torneio')}</h2>
              <p>
                {settings?.groups
                  ? t(
                      'Groups followed by knockout',
                      'Fase de grupos seguida de eliminatórias',
                    )
                  : t('Knockout only', 'Apenas eliminatórias')}
              </p>
              {botCount > 0 && (
                <p className="text-muted">
                  {t(
                    `${botCount} ${botCount === 1 ? 'bot will join' : 'bots will join'} when the tournament starts.`,
                    `${botCount} ${botCount === 1 ? 'bot entra' : 'bots entram'} ao iniciar o torneio.`,
                  )}
                </p>
              )}
              <p className="text-muted">
                {t(
                  `You have ${settings?.roundMinutes ?? 10} minutes to draft your team and the same time in each round to submit your lineup. When time runs out, the game fills in any missing choices at random.`,
                  `Você tem ${settings?.roundMinutes ?? 10} minutos para capturar a equipe e o mesmo tempo em cada rodada para enviar a ordem de batalha. Quando o tempo acaba, o jogo sorteia as escolhas que faltam.`,
                )}
              </p>
              {!isHost && (
                <p role="status">
                  {t(
                    'Waiting for the host to start.',
                    'Aguardando o anfitrião iniciar o torneio.',
                  )}
                </p>
              )}
            </Card>
          )}
          {room.kind === 'tournament' &&
            !room.settings &&
            room.rounds.length > 0 && (
              <Card className="lobby-bracket">
                <h2>{t('Tournament bracket', 'Chave do torneio')}</h2>
                {room.champion && (
                  <HudTag as="p">
                    {t('Champion', 'Campeão')} · {memberName(room.champion)}
                  </HudTag>
                )}
                {room.rounds.map((round, index) => (
                  <section key={index} className="mt-3.5">
                    <h3>
                      {round.length === 1
                        ? t('Final', 'Final')
                        : `${t('Round', 'Rodada')} ${index + 1}`}
                    </h3>
                    {round.map((match, slot) => (
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
                            {memberName(match.winner)} {t('advances', 'avança')}
                          </HudTag>
                        )}
                        {!match.winner &&
                          match.right &&
                          isHost &&
                          [match.left, match.right].map((winner) => (
                            <Button
                              key={winner}
                              disabled={busy}
                              onClick={() =>
                                execute(`/${room.code}/result`, {
                                  round: index,
                                  match: slot,
                                  winner,
                                })
                              }
                            >
                              {memberName(winner)} {t('wins', 'vence')}
                            </Button>
                          ))}
                      </div>
                    ))}
                  </section>
                ))}
              </Card>
            )}
        </>
      )}
    </section>
  )
}
