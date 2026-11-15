import type { Ref } from 'react'
import type { BattleEvent, Side } from '@draftmon/engine'
import { useLanguage } from '../../services/language'
import { HudTag } from '../ui/HudTag'

function eventAppearance(event: BattleEvent, winner: Side) {
  switch (event.kind) {
    case 'move':
      return 'font-semibold'
    case 'damage':
      return event.mult > 1
        ? 'font-semibold text-[#8a5200] dark:text-[#ffd98e]'
        : 'text-muted'
    case 'info':
    case 'stat':
    case 'heal':
      return 'text-muted'
    case 'faint':
      return 'font-bold text-danger'
    case 'switch':
      return 'mt-1 font-bold'
    case 'status':
      return 'text-[#773a9e] dark:text-[#e6bbff]'
    case 'end':
      return `mt-2.5 text-[1.05rem] font-extrabold ${winner === 0 ? 'text-success' : 'text-danger'}`
    default:
      return ''
  }
}

export function BattleLog({
  events,
  winner,
  ref,
}: {
  events: BattleEvent[]
  winner: Side
  ref: Ref<HTMLDivElement>
}) {
  const { t } = useLanguage()
  return (
    <div
      ref={ref}
      aria-live="polite"
      className="h-80 overflow-y-auto rounded-panel border border-line bg-panel px-3.5 py-3 text-[.92rem] max-[860px]:h-65"
    >
      {events.map((event, index) => {
        if (event.kind === 'turn') {
          return (
            <div
              key={index}
              className="mt-2.5 mb-1 flex items-center gap-2 rounded-[7px] bg-panel-muted px-[7px] py-[5px] text-[.68rem] text-muted"
            >
              <HudTag>
                {t('Turn', 'Turno')} {event.turn}
              </HudTag>
              <span>
                {t(event.orderText, event.ptOrder ?? event.orderText)}
              </span>
            </div>
          )
        }
        const side = 'side' in event ? event.side : undefined
        const marker =
          side === 0
            ? 'border-l-[color:var(--side0)]'
            : side === 1
              ? 'border-l-[color:var(--side1)]'
              : 'border-l-transparent'
        return (
          <div
            key={index}
            className={`border-l-[3px] py-0.5 pl-2.5 ${marker} ${eventAppearance(event, winner)}`}
          >
            {t(event.text, event.pt ?? event.text)}
          </div>
        )
      })}
    </div>
  )
}
