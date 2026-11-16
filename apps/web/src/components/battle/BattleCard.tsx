import Image from 'next/image'
import { HudTag } from '../ui/HudTag'
import { Card } from '../ui/Card'
import type { BattleEvent, BattleMon, Side } from '@draftmon/engine'
import { STAT_LABELS } from '@draftmon/engine'
import type { StatName } from '@draftmon/content'
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

function EffectBadges({
  status,
  stages,
}: {
  status: string | null
  stages: Stages
}) {
  const { t, statLabel } = useLanguage()
  const statBadges = (Object.entries(stages) as [StatName, number][]).filter(
    ([, v]) => v !== 0,
  )
  if (!status && statBadges.length === 0) return null
  return (
    <div className="flex min-h-5.5 flex-wrap gap-[5px]">
      {status && (
        <span
          className="effect status rounded-md px-2 py-0.5 text-[.72rem] font-bold text-white [&.down]:bg-[#9b2f3a] [&.up]:bg-[#1f7a52]"
          style={{ background: STATUS_BADGE[status]?.[1] }}
        >
          {t(
            STATUS_BADGE[status]?.[0] ?? status,
            (
              {
                burn: 'Queimado',
                poison: 'Envenenado',
                paralysis: 'Paralisado',
                sleep: 'Dormindo',
                freeze: 'Congelado',
              } as Record<string, string>
            )[status] ?? status,
          )}
        </span>
      )}
      {statBadges.map(([stat, v]) => (
        <span
          key={stat}
          className={`effect rounded-md px-2 py-0.5 text-[.72rem] font-bold text-white [&.down]:bg-[#9b2f3a] [&.up]:bg-[#1f7a52] ${v > 0 ? 'up' : 'down'}`}
        >
          {statLabel(stat, STAT_LABELS[stat])} {v > 0 ? `+${v}` : `−${-v}`}
        </span>
      ))}
    </div>
  )
}

function battleMotion(
  event: BattleEvent,
  next: BattleEvent | undefined,
  side: Side,
) {
  if (event.kind === 'move' && event.attacking) {
    if (event.side === side) return 'lunge'
    if (next?.kind === 'miss') return 'dodge'
  }
  if (!('side' in event) || event.side !== side) return undefined
  if (event.kind === 'damage')
    return (
      event.source ??
      (event.crit
        ? 'critical'
        : event.mult > 1
          ? 'super'
          : event.mult < 1
            ? 'weak'
            : 'hit')
    )
  if (event.kind === 'heal') return 'heal'
  if (event.kind === 'faint') return 'faint'
  if (event.kind === 'switch') return 'enter'
}

export function BattleCard({
  owner,
  portrait,
  lore,
  loreName,
  team,
  view,
  side,
  event,
  next,
  index,
  speed,
  hideBench,
}: {
  owner: string
  portrait: string
  team: BattleMon[]
  view: ViewState
  side: Side
  lore?: [string, string, string, string]
  loreName: string
  hideBench?: boolean
  event: BattleEvent
  next: BattleEvent | undefined
  index: number
  speed: number
}) {
  const { t } = useLanguage()
  const slot = view.active[side]
  const mon = team[slot]
  const hp = view.hp[side][slot]
  const motion = battleMotion(event, next, side)
  const motionStyle = {
    animationDuration: `${Math.min(DELAY[event.kind], 560) / speed}ms`,
  }
  return (
    <div
      className={`battle-card-wrap grid min-w-0 content-start gap-1.5 phone:[&.side-0]:[--advance-x:0px] phone:[&.side-0]:[--advance-y:20px] phone:[&.side-0]:[--retreat-x:0px] phone:[&.side-0]:[--retreat-y:-8px] phone:[&.side-1]:[--advance-x:0px] phone:[&.side-1]:[--advance-y:-20px] phone:[&.side-1]:[--retreat-x:0px] phone:[&.side-1]:[--retreat-y:8px] ${side === 0 ? 'side-0 [--advance-x:clamp(16px,4vw,52px)] [--advance-y:0px] [--retreat-x:-9px] [--retreat-y:0px] [&_.battle-card]:[border-top:4px_solid_var(--side0)]' : 'side-1 [--advance-x:clamp(-52px,-4vw,-16px)] [--advance-y:0px] [--retreat-x:9px] [--retreat-y:0px] [&_.battle-card]:[border-top:4px_solid_var(--side1)] [&_.battle-trainer]:bg-[#fbe7ea] [&_.battle-trainer]:text-[color:var(--side1)] dark:[&_.battle-trainer]:bg-[#4b3042]'}`}
    >
      <div className="battle-trainer flex min-h-[55px] items-center gap-2 rounded-[10px_10px_5px_5px] bg-[#e4edff] px-2.5 py-1 text-[var(--side0)] dark:bg-[#2a3a59] [&_img]:rounded-[8px] [&_img]:bg-[#fff9] [&_img]:object-contain [&_img]:[image-rendering:pixelated] dark:[&_img]:bg-panel-muted">
        {lore ? (
          <LoreCard name={loreName} entry={lore} portrait={portrait}>
            <span className="flex items-center gap-2 text-left">
              <Image
                src={portrait}
                alt=""
                width={48}
                height={48}
                unoptimized
                loading="eager"
              />
              <strong>{owner}</strong>
            </span>
          </LoreCard>
        ) : (
          <>
            <Image
              src={portrait}
              alt=""
              width={48}
              height={48}
              unoptimized
              loading="eager"
            />
            <strong>{owner}</strong>
          </>
        )}
      </div>
      <Card
        key={motion ? `${slot}-${index}` : slot}
        data-motion={motion}
        style={motion ? motionStyle : undefined}
        className={`battle-card relative grid gap-2.5 [border-top-left-radius:6px] [border-top-right-radius:6px] motion-reduce:[animation:none]! phone:[&_.sprite]:h-16 phone:[&_.sprite]:w-16 [&.defeated]:[opacity:.55] [&.defeated]:[filter:grayscale(.9)] [&.defeated[data-motion]:not([data-motion='faint'])]:[opacity:1] [&.defeated[data-motion]:not([data-motion='faint'])]:[filter:none] [&:is([data-motion='hit'],[data-motion='super'],[data-motion='weak'],[data-motion='critical'],[data-motion='burn'],[data-motion='poison'],[data-motion='heal'])]:[animation-name:battle-flash] [&[data-motion='burn']]:[--flash:#e65e22] [&[data-motion='critical']]:[--flash:#e7ae00] [&[data-motion='dodge']]:[animation-name:battle-dodge] [&[data-motion='enter']]:[animation-name:card-in] [&[data-motion='faint']]:[animation-name:battle-faint] [&[data-motion='heal']]:[--flash:#26a66a] [&[data-motion='hit']]:[--flash:#ed354a] [&[data-motion='lunge']]:z-2 [&[data-motion='lunge']]:[animation-name:attack-lunge] [&[data-motion='poison']]:[--flash:#a954c3] [&[data-motion='super']]:[--flash:#ff842b] [&[data-motion='weak']]:[--flash:#69a4f3] [&[data-motion]]:[animation-timing-function:ease-out] ${hp <= 0 ? 'defeated' : ''}`}
      >
        <div className="flex items-center gap-3">
          <Sprite pokemon={mon.species} size={88} />
          <div className="grid min-w-0 flex-1 gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <b className="text-[1.15rem]">{mon.name}</b>
              <HudTag>
                {t('Lv.', 'Nv.')} {mon.level}
              </HudTag>
            </div>
            <div className="flex flex-wrap gap-[5px]">
              {mon.types.map((t) => (
                <TypeBadge key={t} type={t} small />
              ))}
            </div>
            <HpBar hp={hp} max={mon.maxHp} />
          </div>
        </div>
        <EffectBadges
          status={view.status[side][slot]}
          stages={view.stages[side][slot]}
        />
        {hp <= 0 && (
          <div className="defeated-tag absolute top-2.5 right-2.5 rounded-md bg-danger px-2 py-0.5 text-[.7rem] font-extrabold tracking-[.08em] text-white uppercase dark:text-accent-ink">
            {t('Defeated', 'Desmaiou')}
          </div>
        )}
      </Card>
      {!hideBench && (
        <div className="flex flex-wrap gap-1">
          {team.map((m, i) => (
            <span
              key={i}
              className={`bench-mon grid rounded-lg border-2 border-outline bg-panel p-0.5 [&.active]:border-brand [&.out]:[opacity:.35] [&.out]:[filter:grayscale(1)] ${i === slot ? 'active' : ''} ${view.hp[side][i] <= 0 ? 'out' : ''}`}
              title={`${m.name} ${Math.max(0, view.hp[side][i])}/${m.maxHp}`}
            >
              <Sprite pokemon={m.species} size={34} />
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
