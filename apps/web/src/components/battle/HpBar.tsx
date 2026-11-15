export function HpBar({ hp, max }: { hp: number; max: number }) {
  const pct = Math.max(0, (hp / max) * 100)
  const color = pct > 50 ? '#3ddc97' : pct > 20 ? '#f7d02c' : '#ff5c5c'
  return (
    <div className="flex items-center gap-1.5">
      <div className="hp-track h-2.5 flex-1 overflow-hidden rounded-full bg-[#cadaf4] dark:bg-[#13192a]">
        <div
          className="h-full rounded-full [transition:width_.6s_ease,background_.6s]"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="min-w-15 text-right text-[.75rem] text-muted tabular-nums">
        {Math.max(0, hp)}/{max}
      </span>
    </div>
  )
}
