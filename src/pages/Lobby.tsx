import { HudTag } from '../components/ui/HudTag'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useLanguage } from '../services/language'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { avatars, avatarSprite } from '../services/guest'
import type { Guest } from '../services/guest'
import { LoreCard } from '../components/pokemon/LoreCard'
import { protagonists } from '../components/pokemon/lore'
import { Tournament, TournamentReplay } from '../components/tournament/Tournament'
import type { Room } from '../features/tournament/roomApi'
import { useLobbyRoom } from '../features/tournament/useLobbyRoom'

const errors: Record<string, string> = {
  'Request is too large.': 'O pedido é grande demais.',
  'Invalid request data.': 'Dados inválidos.',
  'Guest profile required.': 'É necessário um perfil de convidado.',
  'Choose a valid trainer portrait.': 'Escolha um retrato de treinador válido.',
  'Room not found.': 'Sala não encontrada.',
  'Enter a name and choose a room type.': 'Digite um nome e escolha o tipo de sala.',
  'Room not found. Check the invite code.': 'Sala não encontrada. Confira o código de convite.',
  'This tournament has already started.': 'Este torneio já começou.',
  'This room is full.': 'Esta sala está cheia.',
  'Guest ID already in use.': 'Este ID de convidado já está em uso.',
  'Only the host can start the tournament.': 'Apenas o anfitrião pode iniciar o torneio.',
  'This tournament cannot be started.': 'Não é possível iniciar este torneio.',
  'At least two guests must join.': 'A sala precisa de pelo menos dois convidados.',
  'Only the host can record results.': 'Apenas o anfitrião pode registrar resultados.',
  'This match cannot accept that result.': 'Esta partida não aceita esse resultado.',
  'Room action not found.': 'Ação indisponível para esta sala.',
  'Join the room first.': 'Entre na sala primeiro.',
  'The lobby could not save or load that request.': 'O lobby não conseguiu concluir a operação.',
  'The lobby server is unavailable.': 'O servidor do lobby está indisponível.',
  'Sign in to create a tournament.': 'Entre na sua conta para criar um torneio.',
  'Invalid tournament settings.': 'Configurações do torneio inválidas.',
  'At least two participants are required.': 'São necessários pelo menos dois participantes.',
  'This draft offer has changed.': 'As opções de captura mudaram.',
  'Choose a Pokémon from your current offer.': 'Escolha um Pokémon da lista atual.',
  'This reroll is unavailable.': 'Não é possível sortear novamente.',
  'This tournament round has changed.': 'A rodada do torneio mudou.',
  'The tournament engine is unavailable.': 'O motor do torneio está indisponível.',
  'Replay not available.': 'Replay indisponível.',
  'default': 'Não foi possível conectar à sala.',
}

export function Lobby({ guest, playerName, invite, signedIn, onRoomChange, onBack }: {
  guest: Guest
  playerName: string
  invite: string
  signedIn: boolean
  onRoomChange: (code: string) => void
  onBack: () => void
}) {
  const { t } = useLanguage()
  const { room, replay, closeReplay, busy, error, reconnecting, execute, watchReplay } =
    useLobbyRoom(guest, invite, onRoomChange)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<Room['kind']>(signedIn ? 'tournament' : 'room')
  const [groups, setGroups] = useState(true)
  const [bots, setBots] = useState(0)
  const [roundMinutes, setRoundMinutes] = useState(10)
  const [code, setCode] = useState(invite)
  const [copyMessage, setCopyMessage] = useState('')
  const profile = { name: playerName, avatar: guest.avatar }

  const create = (event: FormEvent) => {
    event.preventDefault()
    void execute('', { ...profile, nameOfRoom: name, kind, groups, bots, roundMinutes })
  }

  const join = (event: FormEvent) => {
    event.preventDefault()
    void execute(`/${code}/join`, profile)
  }

  if (!room) return (
    <section className="grid gap-3.5 max-w-240 mx-auto">
      <Card as="header" className="panel-heading flex items-center justify-between flex-wrap gap-3"><div><h1>{t('League lobby', 'Lobby da Liga')}</h1><p className="text-muted">{t('Create a room or join with an invite code.', 'Crie uma sala ou entre com um código de convite.')}</p></div><Button onClick={onBack}>{t('Home', 'Início')}</Button></Card>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-3.5">
        <Card as="form" className="lobby-form grid gap-3 content-start" onSubmit={create}>
          <h2>{t('Create a room', 'Criar uma sala')}</h2>
          <label>{t('Room name', 'Nome da sala')}<input required maxLength={48} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>{t('Format', 'Formato')}<select value={kind} onChange={(e) => setKind(e.target.value === 'room' ? 'room' : 'tournament')}>
            <option value="tournament" disabled={!signedIn}>{t('Friends tournament', 'Torneio entre amigos')}</option><option value="room">{t('Guest lobby', 'Sala de convidados')}</option>
          </select></label>
          {!signedIn && <p className="text-muted text-[.82rem]">{t('Sign in to host a tournament. You can join as a guest with an invite.', 'Entre na sua conta para criar um torneio. Com convite, você pode jogar como convidado.')}</p>}
          {kind === 'tournament' && <>
            <label className="tournament-checkbox"><input type="checkbox" checked={groups} onChange={(event) => setGroups(event.target.checked)} />{t('Include a group stage', 'Incluir fase de grupos')}</label>
            <label>{t('Bot participants', 'Participantes bot')}<select name="bots" value={bots} onChange={(event) => setBots(Number(event.target.value))}>
              {Array.from({ length: 9 }, (_, count) => <option key={count} value={count}>{count}</option>)}
            </select></label>
            <label>{t('Time limit per stage or round', 'Prazo por etapa ou rodada')}<select value={roundMinutes} onChange={(event) => setRoundMinutes(Number(event.target.value))}>
              {[5, 10, 15, 30, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}
            </select></label>
          </>}
          <Button tone="primary" disabled={busy}>{t('Create room', 'Criar sala')}</Button>
        </Card>
        <Card as="form" className="lobby-form grid gap-3 content-start" onSubmit={join}>
          <h2>{t('Join a room', 'Entrar em uma sala')}</h2>
          <label data-report-private>{t('Invite code', 'Código de convite')}<input required maxLength={8} pattern="[A-F0-9]{8}" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, ''))} /></label>
          <Button tone="primary" disabled={busy}>{t('Join room', 'Entrar na sala')}</Button>
        </Card>
      </div>
      {error && <Card as="p" compact className="m-0 py-2.5 text-danger px-4.5" role="alert">{t(error, errors[error] ?? errors.default)}</Card>}
    </section>
  )

  const isHost = room.host === room.selfId
  const memberName = (id: string) => room.members.find((member) => member.id === id)?.name ?? id
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyMessage('copied')
    } catch {
      setCopyMessage('code')
    }
  }

  return (
    <section className="grid gap-3.5 max-w-240 mx-auto">
      <Card as="header" className="panel-heading flex items-center justify-between flex-wrap gap-3"><div><h1>{room.name}</h1><HudTag>{room.kind === 'tournament' ? t('Tournament', 'Torneio') : t('Guest lobby', 'Sala de convidados')}</HudTag></div><Button onClick={onBack}>{t('Home', 'Início')}</Button></Card>
      <Card className="panel-heading flex items-center justify-between flex-wrap gap-3">
        <div className="invite-code grid gap-0.5" data-report-private><span className="text-muted text-[.82rem]">{t('Invite code', 'Código de convite')}</span><strong>{room.code}</strong></div>
        <Button onClick={copyInvite}>{t('Copy invite link', 'Copiar link do convite')}</Button>
        {copyMessage === 'copied' && <span className="text-muted text-[.82rem]" role="status">{t('Invite link copied.', 'Link do convite copiado.')}</span>}
        {copyMessage === 'code' && <input className="w-full p-2 bg-panel-muted text-ink border border-line rounded-lg" data-report-private aria-label={t('Invite link', 'Link do convite')} value={window.location.href} readOnly onFocus={(event) => event.currentTarget.select()} />}
      </Card>
      {(error || reconnecting) && <Card as="p" compact className="m-0 py-2.5 text-danger px-4.5" role="status">{error ? t(error, errors[error] ?? errors.default) : t('Reconnecting to the room…', 'Reconectando à sala…')}</Card>}
      {replay ? <TournamentReplay replay={replay} onBack={closeReplay} /> : <>
      {!room.play && <Card>
        <h2>{t('Trainers', 'Treinadores')} <HudTag>{room.members.length}/16</HudTag></h2>
        <ul className="lobby-members m-0 p-0 list-none grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-[7px]">
          {room.members.map((member) => <li key={member.id}>
            <LoreCard name={avatars.find((avatar) => avatar.id === member.avatar)?.name ?? member.name} entry={protagonists[member.avatar]} portrait={avatarSprite(member.avatar)}>
              <img src={avatarSprite(member.avatar)} alt="" width={40} height={40} />
            </LoreCard>
            <div><strong>{member.name}</strong><small>ID {member.id}</small></div>
            {member.id === room.host && <HudTag>{t('Host', 'Anfitrião')}</HudTag>}
          </li>)}
        </ul>
      </Card>}
      {room.play && <Tournament play={room.play} selfId={room.selfId} busy={busy} act={(action, body) => execute(`/${room.code}/${action}`, body)} watch={watchReplay} />}
      {room.settings && !room.play && <Card>
        <h2>{t('Tournament rules', 'Regras do torneio')}</h2>
        <p>{room.settings.groups ? t('Groups followed by knockout', 'Fase de grupos seguida de eliminatórias') : t('Knockout only', 'Apenas eliminatórias')} · {room.settings.bots} bot(s)</p>
        <p className="text-muted">{t(
          `You have ${room.settings.roundMinutes ?? 10} minutes to draft your team and the same time in each round to submit your lineup. When time runs out, the game fills in any missing choices at random.`,
          `Você tem ${room.settings.roundMinutes ?? 10} minutos para capturar a equipe e o mesmo tempo em cada rodada para enviar a ordem de batalha. Quando o tempo acaba, o jogo sorteia as escolhas que faltam.`,
        )}</p>
        {isHost && <Button tone="primary" disabled={busy || room.members.length + room.settings.bots < 2} onClick={() => execute(`/${room.code}/start`, {})}>{t('Start tournament', 'Iniciar torneio')}</Button>}
      </Card>}
      {room.kind === 'tournament' && !room.settings && <Card className="lobby-bracket">
        <h2>{t('Tournament bracket', 'Chave do torneio')}</h2>
        {room.champion && <HudTag as="p">{t('Champion', 'Campeão')} · {memberName(room.champion)}</HudTag>}
        {!room.rounds.length && <>
          <p className="text-muted">{t('The host can generate the bracket after at least two guests join and record match results.', 'O anfitrião pode gerar a chave com pelo menos dois convidados e registrar os resultados das partidas.')}</p>
          {isHost && <Button tone="primary" disabled={busy || room.members.length < 2} onClick={() => execute(`/${room.code}/start`, {})}>{t('Start tournament', 'Iniciar torneio')}</Button>}
        </>}
        {room.rounds.map((round, index) => <section key={index} className="mt-3.5">
          <h3>{round.length === 1 ? t('Final', 'Final') : `${t('Round', 'Rodada')} ${index + 1}`}</h3>
          {round.map((match, slot) => <div className="tournament-match flex items-center flex-wrap gap-2 mt-1.5 bg-panel-muted rounded-lg p-2" key={slot}>
            <strong>{memberName(match.left)}{match.right ? ` vs ${memberName(match.right)}` : t(' · Bye', ' · Avança direto')}</strong>
            {match.winner && <HudTag>{memberName(match.winner)} {t('advances', 'avança')}</HudTag>}
            {!match.winner && match.right && isHost && [match.left, match.right].map((winner) => (
              <Button key={winner} disabled={busy} onClick={() => execute(`/${room.code}/result`, { round: index, match: slot, winner })}>
                {memberName(winner)} {t('wins', 'vence')}
              </Button>
            ))}
          </div>)}
        </section>)}
      </Card>}
      </>}
    </section>
  )
}
