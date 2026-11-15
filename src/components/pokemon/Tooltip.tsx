import type { ReactNode } from 'react'

/** Hover/focus/tap tooltip. */
export function Tip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <span className="tip relative inline-flex [outline:none]" tabIndex={0}>
      {children}
      <span className="tip-box" role="tooltip">
        {content}
      </span>
    </span>
  )
}
