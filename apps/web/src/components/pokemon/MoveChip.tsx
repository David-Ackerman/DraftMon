import { gameData } from '@draftmon/content'
import { useLanguage } from '../../services/language'
import { moveEffect, moveLabel } from '@draftmon/engine'
import type { ApiMove } from '@draftmon/content'
import { Tip } from './Tooltip'
import { TYPE_COLORS } from './typeColors'

export function MoveChip({ move }: { move: ApiMove }) {
  const { language, t, typeLabel } = useLanguage()
  const cls = move.damage_class.name
  const name = moveLabel(move.name, language, gameData.moveTranslations)
  const effect = moveEffect(move, language, gameData.moveTranslations)
  const classLabel =
    cls === 'status'
      ? t('status', 'estado')
      : cls === 'physical'
        ? t('physical', 'físico')
        : t('special', 'especial')
  const info = (
    <>
      <div className="text-[.85rem] font-extrabold capitalize">{name}</div>
      <div className="tip-row flex flex-wrap gap-2 [&_>_span:last-child]:[min-width:0] [&_>_span:last-child]:[flex:1]">
        <span
          className="mr-1.5 font-bold capitalize"
          style={{ color: TYPE_COLORS[move.type.name] }}
        >
          {typeLabel(move.type.name)}
        </span>
        <span>{classLabel}</span>
      </div>
      <div className="tip-row flex flex-wrap gap-2 [&_>_span:last-child]:[min-width:0] [&_>_span:last-child]:[flex:1]">
        <span>
          {t('Power', 'Poder')} {move.power ?? '—'}
        </span>
        <span>
          {t('Accuracy', 'Precisão')}{' '}
          {move.accuracy === null ? '—' : `${move.accuracy}%`}
        </span>
        {move.priority !== 0 && (
          <span>
            {t('Priority', 'Prioridade')}{' '}
            {move.priority > 0 ? `+${move.priority}` : move.priority}
          </span>
        )}
      </div>
      {effect && (
        <div className="text-muted" lang={effect.language}>
          {effect.text}
        </div>
      )}
    </>
  )
  return (
    <Tip content={info}>
      <span
        className="move-chip inline-flex items-center gap-[5px] rounded-lg border bg-panel-muted px-2 py-[3px] text-[.74rem]"
        style={{ borderColor: TYPE_COLORS[move.type.name] }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: TYPE_COLORS[move.type.name] }}
        />
        {name}
        <span className="text-[.66rem] text-muted">
          {cls === 'status' ? classLabel : `${move.power} ${classLabel}`}
        </span>
      </span>
    </Tip>
  )
}
