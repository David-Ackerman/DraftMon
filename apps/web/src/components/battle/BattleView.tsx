import { HudTag } from '../ui/HudTag'
import { Button } from '../ui/Button'
import type { BattleResult } from '@draftmon/engine'
import type { LeagueMatch } from '@draftmon/engine'
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
  const { index, speed, setSpeed, logRef, finished, view, event, next, skip } =
    useBattlePlayback(result, onComplete)
  const won = result.winner === 0

  return (
    <div className="grid gap-3.5">
      <header className="battle-head flex items-center justify-center gap-2.5 rounded-xl border-2 border-outline bg-panel p-2.5 [&_h2]:m-0 [&_h2]:text-left [&_h2]:text-[1.08rem]">
        <HudTag>
          {replay ? t('Replay', 'Replay') : stageLabel(match.stage)}
        </HudTag>
        <h2>
          {replay
            ? t('Tournament duel', 'Duelo do torneio')
            : trainerTitle(match.trainer.title)}
        </h2>
      </header>

      <div className="battle-board grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3.5 phone:[grid-template-columns:1fr]">
        <BattleCard
          owner={playerName}
          portrait={playerSprite}
          lore={protagonists[playerAvatar.id] ?? opponents[playerAvatar.id]}
          loreName={playerAvatar.name}
          team={result.teams[0]}
          view={view}
          side={0}
          event={event}
          next={next}
          index={index}
          speed={speed}
          hideBench={replay}
        />
        <BattleCard
          owner={match.trainer.name}
          portrait={match.trainer.sprite}
          lore={
            opponentAvatar
              ? protagonists[opponentAvatar]
              : opponents[match.trainer.id]
          }
          loreName={match.trainer.name}
          team={result.teams[1]}
          view={view}
          side={1}
          event={event}
          next={next}
          index={index}
          speed={speed}
          hideBench={replay}
        />
      </div>

      <BattleLog
        events={result.events.slice(0, index + 1)}
        winner={result.winner}
        ref={logRef}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-outline bg-panel p-2">
        {!finished ? (
          <>
            <div
              className="speed-control inline-flex items-center gap-[3px] rounded-[10px] border-2 border-outline bg-panel-muted p-[3px] [&_.btn]:border-transparent [&_.btn]:[padding:5px_8px] [&_.btn[aria-pressed='true']]:border-[color:#a97011] [&_.btn[aria-pressed='true']]:bg-accent dark:[&_.btn[aria-pressed='true']]:text-accent-ink"
              role="group"
              aria-label={t('Playback speed', 'Velocidade da reprodução')}
            >
              <span
                className="px-1.5 py-0 text-[.78rem] font-bold text-muted"
                aria-hidden="true"
              >
                {t('Speed', 'Velocidade')}
              </span>
              {[1, 2, 4].map((s) => (
                <Button
                  key={s}
                  className="silent"
                  aria-pressed={speed === s}
                  onClick={() => setSpeed(s)}
                >
                  {s}×
                </Button>
              ))}
            </div>
            <Button className="silent" onClick={skip}>
              {t('Skip to result', 'Pular para o resultado')}
            </Button>
          </>
        ) : (
          <Button
            tone={won ? 'primary' : 'danger'}
            size="large"
            className="silent w-full"
            onClick={onDone}
          >
            {replay
              ? t('Back to tournament', 'Voltar ao torneio')
              : won
                ? t('Victory! Continue', 'Vitória! Continuar')
                : t('Defeat. See results', 'Derrota. Ver resultado')}
          </Button>
        )}
      </div>
    </div>
  )
}
