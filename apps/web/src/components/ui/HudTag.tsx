import type { ReactNode } from 'react'
import { cva } from 'class-variance-authority'

const tag = cva(
  'inline-flex items-center rounded-md bg-[#e5edfd] px-2 py-[3px] leading-[1.3] font-[750] dark:bg-panel-muted',
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
