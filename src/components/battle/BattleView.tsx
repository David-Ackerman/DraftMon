import { HudTag } from '../ui/HudTag'
import { Button } from '../ui/Button'
import type { BattleResult } from '../../engine/battle'
import type { LeagueMatch } from '../../engine/game'
import { opponents, protagonists } from '../pokemon/lore'
import { BattleCard } from './BattleCard'
import { BattleLog } from './BattleLog'
import { useBattlePlayback } from './useBattlePlayback'
import { useLanguage } from '../../services/language'

export function BattleView({
  result,
  match,
  playerName,
  playerSprite,
  playerAvatar,
  opponentAvatar,
  replay = false,
  onDone,
  onComplete,
}: {
  result: BattleResult
  match: LeagueMatch
  playerName: string
  playerSprite: string
  playerAvatar: { id: string; name: string }
  opponentAvatar?: string
  replay?: boolean
  onDone: () => void
  onComplete?: () => void
}) {
  const { t, stageLabel, trainerTitle } = useLanguage()
  const { index, speed, setSpeed, logRef, finished, view, event, next, skip } = useBattlePlayback(result, onComplete)
  const won = result.winner === 0

  return (
    <div className="grid gap-3.5">
      <header className="battle-head flex items-center justify-center gap-2.5 p-2.5 bg-panel border border-line rounded-xl">
        <HudTag>{replay ? t('Replay', 'Replay') : stageLabel(match.stage)}</HudTag>
        <h2>{replay ? t('Tournament duel', 'Duelo do torneio') : trainerTitle(match.trainer.title)}</h2>
      </header>

      <div className="battle-board grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3.5">
        <BattleCard owner={playerName} portrait={playerSprite} lore={protagonists[playerAvatar.id] ?? opponents[playerAvatar.id]} loreName={playerAvatar.name} team={result.teams[0]} view={view} side={0} event={event} next={next} index={index} speed={speed} hideBench={replay} />
        <BattleCard owner={match.trainer.name} portrait={match.trainer.sprite} lore={opponentAvatar ? protagonists[opponentAvatar] : opponents[match.trainer.id]} loreName={match.trainer.name} team={result.teams[1]} view={view} side={1} event={event} next={next} index={index} speed={speed} hideBench={replay} />
      </div>

      <BattleLog events={result.events.slice(0, index + 1)} winner={result.winner} ref={logRef} />

      <div className="flex flex-wrap items-center gap-2 p-2 bg-panel border border-line rounded-xl">
        {!finished ? (
          <>
            <div className="speed-control inline-flex items-center gap-[3px] p-[3px] border border-line rounded-[10px] bg-panel-muted" role="group" aria-label={t('Playback speed', 'Velocidade da reprodução')}>
              <span className="py-0 px-1.5 text-muted text-[.78rem] font-bold" aria-hidden="true">{t('Speed', 'Velocidade')}</span>
              {[1, 2, 4].map((s) => (
                <Button key={s} aria-pressed={speed === s} onClick={() => setSpeed(s)}>
                  {s}×
                </Button>
              ))}
            </div>
            <Button onClick={skip}>
              {t('Skip to result', 'Pular para o resultado')}
            </Button>
          </>
        ) : (
          <Button tone={won ? 'primary' : 'danger'} size="large" className="w-full" onClick={onDone}>
            {replay ? t('Back to tournament', 'Voltar ao torneio') : won ? t('Victory! Continue', 'Vitória! Continuar') : t('Defeat. See results', 'Derrota. Ver resultado')}
          </Button>
        )}
      </div>
    </div>
  )
}
