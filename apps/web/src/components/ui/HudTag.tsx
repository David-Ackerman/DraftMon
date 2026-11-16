import type { ReactNode } from 'react'
import { cva } from 'class-variance-authority'

const tag = cva(
  'inline-flex items-center rounded-full border-2 border-outline bg-panel-muted px-2.5 py-[3px] leading-[1.3] font-[850]',
  {
    variants: {
      muted: {
        true: 'mb-1.5 text-[.85rem] text-muted',
        false: 'text-[.72rem] text-brand',
      },
    },
  },
)

export function HudTag({
  as: Tag = 'span',
  muted = false,
  children,
}: {
  as?: 'span' | 'div' | 'p'
  muted?: boolean
  children: ReactNode
}) {
  return <Tag className={tag({ muted })}>{children}</Tag>
}
