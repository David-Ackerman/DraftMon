import { useLanguage } from '../../services/language'
import { effectiveness } from '@draftmon/engine'
import { chart } from '../../services/chart'
import { DARK_TEXT, TYPE_COLORS } from './typeColors'
import { Tip } from './Tooltip'
import { cva } from 'class-variance-authority'
import type { CSSProperties } from 'react'

const badgeClass = cva(
  'type-badge inline-block rounded-full bg-(--type) align-middle font-bold tracking-[.05em] text-[color:var(--type-ink)] uppercase [text-shadow:none]',
  {
    variants: {
      small: {
        true: 'px-[7px] py-px text-[.62rem]',
        false: 'px-2.5 py-0.5 text-[.72rem]',
      },
    },
  },
)

function TypeList({
  label,
  types,
  tone,
}: {
  label: string
  types: string[]
  tone: 'good' | 'bad' | 'none'
}) {
  const { typeLabel } = useLanguage()
  if (types.length === 0) return null
  return (
    <div className="tip-row flex flex-wrap gap-2 [&_>_span:last-child]:[min-width:0] [&_>_span:last-child]:[flex:1]">
      <span
        className={`tip-label min-w-13.5 font-bold [&.bad]:text-danger [&.good]:text-success [&.none]:text-muted ${tone}`}
      >
        {label}
      </span>
      <span>
        {types.map((t) => (
          <span
            key={t}
            className="mr-1.5 font-bold capitalize"
            style={{ color: TYPE_COLORS[t] }}
          >
            {typeLabel(t)}
          </span>
        ))}
      </span>
    </div>
  )
}

function TypeInfo({ type }: { type: string }) {
  const { t, typeLabel } = useLanguage()
  const all = [...chart.keys()]
  const atk = (def: string) => effectiveness(chart, type, [def])
  const def = (a: string) => effectiveness(chart, a, [type])
  return (
    <>
      <div className="text-[.85rem] font-extrabold capitalize">
        {t(`${type} type`, `Tipo ${typeLabel(type)}`)}
      </div>
      <div className="mt-1 text-[.64rem] tracking-[.1em] text-muted uppercase">
        {t('Attacking', 'Ataque')}
      </div>
      <TypeList
        label={t('2× vs', '2× contra')}
        types={all.filter((t) => atk(t) > 1)}
        tone="good"
      />
      <TypeList
        label={t('½× vs', '½× contra')}
        types={all.filter((t) => atk(t) > 0 && atk(t) < 1)}
        tone="bad"
      />
      <TypeList
        label={t('0× vs', '0× contra')}
        types={all.filter((t) => atk(t) === 0)}
        tone="none"
      />
      <div className="mt-1 text-[.64rem] tracking-[.1em] text-muted uppercase">
        {t('Defending', 'Defesa')}
      </div>
      <TypeList
        label={t('Weak to', 'Fraco contra')}
        types={all.filter((t) => def(t) > 1)}
        tone="bad"
      />
      <TypeList
        label={t('Resists', 'Resiste a')}
        types={all.filter((t) => def(t) > 0 && def(t) < 1)}
        tone="good"
      />
      <TypeList
        label={t('Immune', 'Imune a')}
        types={all.filter((t) => def(t) === 0)}
        tone="good"
      />
    </>
  )
}

export function TypeBadge({
  type,
  small,
  tip = true,
}: {
  type: string
  small?: boolean
  tip?: boolean
}) {
  const { typeLabel } = useLanguage()
  const badge = (
    <span
      className={badgeClass({ small: Boolean(small) })}
      style={
        {
          '--type': TYPE_COLORS[type] ?? '#888',
          '--type-ink': DARK_TEXT.has(type) ? '#1d1d1d' : '#fff',
        } as CSSProperties
      }
    >
      {typeLabel(type)}
    </span>
  )
  return tip ? <Tip content={<TypeInfo type={type} />}>{badge}</Tip> : badge
}
