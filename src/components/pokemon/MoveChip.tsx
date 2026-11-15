import { useLanguage } from '../../services/language'
import { moveEffect, moveLabel } from '../../engine/data'
import type { ApiMove } from '../../engine/data'
import { Tip } from './Tooltip'
import { TYPE_COLORS } from './typeColors'

export function MoveChip({ move }: { move: ApiMove }) {
  const { language, t, typeLabel } = useLanguage()
  const cls = move.damage_class.name
  const name = moveLabel(move.name, language)
  const effect = moveEffect(move, language)
  const classLabel = cls === 'status' ? t('status', 'estado') : cls === 'physical' ? t('physical', 'físico') : t('special', 'especial')
  const info = (
    <>
      <div className="font-extrabold capitalize text-[.85rem]">{name}</div>
      <div className="tip-row flex gap-2 flex-wrap">
        <span className="font-bold capitalize mr-1.5" style={{ color: TYPE_COLORS[move.type.name] }}>
          {typeLabel(move.type.name)}
        </span>
        <span>{classLabel}</span>
      </div>
      <div className="tip-row flex gap-2 flex-wrap">
        <span>{t('Power', 'Poder')} {move.power ?? '—'}</span>
        <span>{t('Accuracy', 'Precisão')} {move.accuracy === null ? '—' : `${move.accuracy}%`}</span>
        {move.priority !== 0 && <span>{t('Priority', 'Prioridade')} {move.priority > 0 ? `+${move.priority}` : move.priority}</span>}
      </div>
      {effect && <div className="text-muted" lang={effect.language}>{effect.text}</div>}
    </>
  )
  return (
    <Tip content={info}>
      <span className="move-chip inline-flex items-center gap-[5px] text-[.74rem] py-[3px] px-2 rounded-lg bg-panel-muted border" style={{ borderColor: TYPE_COLORS[move.type.name] }}>
        <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[move.type.name] }} />
        {name}
        <span className="text-muted text-[.66rem]">{cls === 'status' ? classLabel : `${move.power} ${classLabel}`}</span>
      </span>
    </Tip>
  )
}
