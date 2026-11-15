import { useLanguage } from '../../services/language'
import { effectiveness } from '../../engine/typeChart'
import { chart } from '../../engine/chart'
import { DARK_TEXT, TYPE_COLORS } from './typeColors'
import { Tip } from './Tooltip'

function TypeList({ label, types, tone }: { label: string; types: string[]; tone: 'good' | 'bad' | 'none' }) {
  const { typeLabel } = useLanguage()
  if (types.length === 0) return null
  return (
    <div className="tip-row flex gap-2 flex-wrap">
      <span className={`tip-label font-bold min-w-13.5 ${tone}`}>{label}</span>
      <span>
        {types.map((t) => (
          <span key={t} className="font-bold capitalize mr-1.5" style={{ color: TYPE_COLORS[t] }}>
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
      <div className="font-extrabold capitalize text-[.85rem]">{t(`${type} type`, `Tipo ${typeLabel(type)}`)}</div>
      <div className="text-[.64rem] uppercase tracking-[.1em] text-muted mt-1">{t('Attacking', 'Ataque')}</div>
      <TypeList label={t('2× vs', '2× contra')} types={all.filter((t) => atk(t) > 1)} tone="good" />
      <TypeList label={t('½× vs', '½× contra')} types={all.filter((t) => atk(t) > 0 && atk(t) < 1)} tone="bad" />
      <TypeList label={t('0× vs', '0× contra')} types={all.filter((t) => atk(t) === 0)} tone="none" />
      <div className="text-[.64rem] uppercase tracking-[.1em] text-muted mt-1">{t('Defending', 'Defesa')}</div>
      <TypeList label={t('Weak to', 'Fraco contra')} types={all.filter((t) => def(t) > 1)} tone="bad" />
      <TypeList label={t('Resists', 'Resiste a')} types={all.filter((t) => def(t) > 0 && def(t) < 1)} tone="good" />
      <TypeList label={t('Immune', 'Imune a')} types={all.filter((t) => def(t) === 0)} tone="good" />
    </>
  )
}

export function TypeBadge({ type, small, tip = true }: { type: string; small?: boolean; tip?: boolean }) {
  const { typeLabel } = useLanguage()
  const badge = (
    <span
      className={`type-badge inline-block rounded-full align-middle font-bold uppercase tracking-[.05em] [text-shadow:none] ${small ? 'px-[7px] py-px text-[.62rem]' : 'px-2.5 py-0.5 text-[.72rem]'}`}
      style={{ background: TYPE_COLORS[type] ?? '#888', color: DARK_TEXT.has(type) ? '#1d1d1d' : '#fff' }}
    >
      {typeLabel(type)}
    </span>
  )
  return tip ? <Tip content={<TypeInfo type={type} />}>{badge}</Tip> : badge
}
