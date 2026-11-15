import { useLanguage } from '../../services/language'
import {
  baseStat,
  baseStatTotal,
  STAT_LABELS,
  STAT_NAMES,
} from '@draftmon/engine'
import type { ApiPokemon } from '@draftmon/content'

const statColor = (v: number) =>
  v >= 110 ? '#3ddc97' : v >= 85 ? '#9be15d' : v >= 60 ? '#f7d02c' : '#ff7a59'
const statRow =
  'grid grid-cols-[minmax(38px,54px)_30px_1fr] items-center gap-1.5 text-[.78rem]'

export function StatBars({ pokemon }: { pokemon: ApiPokemon }) {
  const { statLabel } = useLanguage()
  return (
    <div className="mx-0 my-1 grid gap-[3px]">
      {STAT_NAMES.map((s) => {
        const v = baseStat(pokemon, s)
        return (
          <div className={statRow} key={s}>
            <span className="font-semibold text-muted">
              {statLabel(s, STAT_LABELS[s])}
            </span>
            <span className="text-right font-bold tabular-nums">{v}</span>
            <span className="stat-track h-[7px] overflow-hidden rounded-full bg-[#18244a16] dark:bg-[#13192a]">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${Math.min(100, (v / 150) * 100)}%`,
                  background: statColor(v),
                }}
              />
            </span>
          </div>
        )
      })}
      <div className={`${statRow} mt-0.5 border-t border-line pt-[3px]`}>
        <span className="font-semibold text-muted">Total</span>
        <span className="text-right font-bold tabular-nums">
          {baseStatTotal(pokemon)}
        </span>
      </div>
    </div>
  )
}
