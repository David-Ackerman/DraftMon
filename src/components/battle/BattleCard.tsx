import { HudTag } from '../ui/HudTag'
import { Card } from '../ui/Card'
import type { BattleEvent, BattleMon, Side } from '../../engine/battle'
import { STAT_LABELS } from '../../engine/data'
import type { StatName } from '../../engine/data'
import type { Stages, ViewState } from './battleState'
import { HpBar } from './HpBar'
import { Sprite } from '../pokemon/Sprite'
import { TypeBadge } from '../pokemon/TypeBadge'
import { LoreCard } from '../pokemon/LoreCard'
import { DELAY } from './useBattlePlayback'
import { useLanguage } from '../../services/language'

const STATUS_BADGE: Record<string, [string, string]> = {
  burn: ['Burned', '#EE8130'],
  poison: ['Poisoned', '#A33EA1'],
  paralysis: ['Paralyzed', '#c9a400'],
  sleep: ['Asleep', '#7f8c9a'],
  freeze: ['Frozen', '#4fb3d9'],
}

function EffectBadges({ status, stages }: { status: string | null; stages: Stages }) {
  const { t, statLabel } = useLanguage()
  const statBadges = (Object.entries(stages) as [StatName, number][]).filter(([, v]) => v !== 0)
  if (!status && statBadges.length === 0) return null
  return (
    <div className="flex flex-wrap gap-[5px] min-h-5.5">
      {status && (
        <span className="effect text-[.72rem] font-bold py-0.5 px-2 rounded-md text-white status" style={{ background: STATUS_BADGE[status]?.[1] }}>
          {t(STATUS_BADGE[status]?.[0] ?? status, ({ burn: 'Queimado', poison: 'Envenenado', paralysis: 'Paralisado', sleep: 'Dormindo', freeze: 'Congelado' } as Record<string, string>)[status] ?? status)}
        </span>
      )}
      {statBadges.map(([stat, v]) => (
        <span key={stat} className={`effect text-[.72rem] font-bold py-0.5 px-2 rounded-md text-white ${v > 0 ? 'up' : 'down'}`}>
          {statLabel(stat, STAT_LABELS[stat])} {v > 0 ? `+${v}` : `−${-v}`}
        </span>
      ))}
    </div>
  )
}

function battleMotion(event: BattleEvent, next: BattleEvent | undefined, side: Side) {
  if (event.kind === 'move' && event.attacking) {
    if (event.side === side) return 'lunge'
    if (next?.kind === 'miss') return 'dodge'
  }
  if (!('side' in event) || event.side !== side) return undefined
  if (event.kind === 'damage') return event.source ?? (event.crit ? 'critical' : event.mult > 1 ? 'super' : event.mult < 1 ? 'weak' : 'hit')
  if (event.kind === 'heal') return 'heal'
  if (event.kind === 'faint') return 'faint'
  if (event.kind === 'switch') return 'enter'
}

export function BattleCard({ owner, portrait, lore, loreName, team, view, side, event, next, index, speed, hideBench }: {
  owner: string; portrait: string; team: BattleMon[]; view: ViewState; side: Side
  lore?: [string, string, string, string]; loreName: string
  hideBench?: boolean
  event: BattleEvent; next: BattleEvent | undefined; index: number; speed: number
}) {
  const { t } = useLanguage()
  const slot = view.active[side]
  const mon = team[slot]
  const hp = view.hp[side][slot]
  const motion = battleMotion(event, next, side)
  const motionStyle = { animationDuration: `${Math.min(DELAY[event.kind], 560) / speed}ms` }
  return (
    <div className={`battle-card-wrap min-w-0 side-${side}`}>
      <div className="battle-trainer flex items-center gap-2 py-1 px-2.5 min-h-[55px] rounded-[10px_10px_5px_5px] bg-[#e4edff] text-[var(--side0)]">
        {lore ? <LoreCard name={loreName} entry={lore} portrait={portrait}><span className="flex items-center gap-2 text-left"><img src={portrait} alt="" width={48} height={48} /><strong>{owner}</strong></span></LoreCard>
          : <><img src={portrait} alt="" width={48} height={48} /><strong>{owner}</strong></>}
      </div>
      <Card key={motion ? `${slot}-${index}` : slot} data-motion={motion} style={motion ? motionStyle : undefined} className={`battle-card ${hp <= 0 ? 'defeated' : ''}`}>
        <div className="flex gap-3 items-center">
          <Sprite pokemon={mon.species} size={88} />
          <div className="flex-1 min-w-0 grid gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <b className="text-[1.15rem]">{mon.name}</b>
              <HudTag>{t('Lv.', 'Nv.')} {mon.level}</HudTag>
            </div>
            <div className="flex gap-[5px] flex-wrap">
              {mon.types.map((t) => (
                <TypeBadge key={t} type={t} small />
              ))}
            </div>
            <HpBar hp={hp} max={mon.maxHp} />
          </div>
        </div>
        <EffectBadges status={view.status[side][slot]} stages={view.stages[side][slot]} />
        {hp <= 0 && <div className="defeated-tag absolute top-2.5 right-2.5 bg-danger text-white text-[.7rem] font-extrabold uppercase tracking-[.08em] py-0.5 px-2 rounded-md">{t('Defeated', 'Desmaiou')}</div>}
      </Card>
      {!hideBench && <div className="flex gap-1 flex-wrap">
        {team.map((m, i) => (
          <span
            key={i}
            className={`bench-mon bg-panel border border-line rounded-lg p-0.5 grid ${i === slot ? 'active' : ''} ${view.hp[side][i] <= 0 ? 'out' : ''}`}
            title={`${m.name} ${Math.max(0, view.hp[side][i])}/${m.maxHp}`}
          >
            <Sprite pokemon={m.species} size={34} />
          </span>
        ))}
      </div>}
    </div>
  )
}
