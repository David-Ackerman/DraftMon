import { useLanguage } from '../../services/language'
import { baseStat, baseStatTotal, STAT_LABELS, STAT_NAMES } from '../../engine/data'
import type { ApiPokemon } from '../../engine/data'

const statColor = (v: number) => (v >= 110 ? '#3ddc97' : v >= 85 ? '#9be15d' : v >= 60 ? '#f7d02c' : '#ff7a59')
const statRow = 'grid grid-cols-[minmax(38px,54px)_30px_1fr] items-center gap-1.5 text-[.78rem]'

export function StatBars({ pokemon }: { pokemon: ApiPokemon }) {
  const { statLabel } = useLanguage()
  return (
    <div className="grid gap-[3px] my-1 mx-0">
      {STAT_NAMES.map((s) => {
        const v = baseStat(pokemon, s)
        return (
          <div className={statRow} key={s}>
            <span className="text-muted font-semibold">{statLabel(s, STAT_LABELS[s])}</span>
            <span className="text-right tabular-nums font-bold">{v}</span>
            <span className="stat-track h-[7px] bg-[#18244a16] rounded-full overflow-hidden">
              <span className="block h-full rounded-full" style={{ width: `${Math.min(100, (v / 150) * 100)}%`, background: statColor(v) }} />
            </span>
          </div>
        )
      })}
      <div className={`${statRow} mt-0.5 border-t border-line pt-[3px]`}>
        <span className="text-muted font-semibold">Total</span>
        <span className="text-right tabular-nums font-bold">{baseStatTotal(pokemon)}</span>
      </div>
    </div>
  )
}
