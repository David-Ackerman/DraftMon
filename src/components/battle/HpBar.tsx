export function HpBar({ hp, max }: { hp: number; max: number }) {
  const pct = Math.max(0, (hp / max) * 100)
  const color = pct > 50 ? '#3ddc97' : pct > 20 ? '#f7d02c' : '#ff5c5c'
  return (
    <div className="flex items-center gap-1.5">
      <div className="hp-track flex-1 h-2.5 bg-[#cadaf4] rounded-full overflow-hidden">
        <div className="h-full [transition:width_.6s_ease,background_.6s] rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[.75rem] tabular-nums text-muted min-w-15 text-right">
        {Math.max(0, hp)}/{max}
      </span>
    </div>
  )
}
