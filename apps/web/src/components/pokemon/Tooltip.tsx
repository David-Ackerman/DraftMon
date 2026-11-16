import type { ReactNode } from 'react'

/** Hover/focus/tap tooltip. */
export function Tip({
  content,
  children,
}: {
  content: ReactNode
  children: ReactNode
}) {
  return (
    <span
      className="tip relative inline-flex [outline:none] [&:focus_>_.tip-box]:grid [&:focus_>_.tip-box]:gap-1 [&:hover_>_.tip-box]:grid [&:hover_>_.tip-box]:gap-1"
      tabIndex={0}
    >
      {children}
      <span
        className="tip-box pointer-events-none absolute [bottom:calc(100%_+_8px)] left-0 z-50 hidden w-60 rounded-[10px] bg-white [padding:10px_12px] text-left text-[.76rem] [line-height:1.4] font-medium [letter-spacing:0] text-ink normal-case shadow-[0_10px_30px_#18244a30] [border:3px_solid_var(--outline)] dark:bg-panel-muted"
        role="tooltip"
      >
        {content}
      </span>
    </span>
  )
}
