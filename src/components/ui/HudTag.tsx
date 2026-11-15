import type { ReactNode } from 'react'

export function HudTag({ as: Tag = 'span', muted = false, children }: {
  as?: 'span' | 'div' | 'p'
  muted?: boolean
  children: ReactNode
}) {
  return <Tag className={`inline-flex items-center rounded-md bg-[#e5edfd] px-2 py-[3px] font-[750] leading-[1.3] dark:bg-panel-muted ${muted ? 'mb-1.5 text-[.85rem] text-muted' : 'text-[.72rem] text-brand'}`}>
    {children}
  </Tag>
}
