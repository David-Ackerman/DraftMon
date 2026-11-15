import { createElement } from 'react'
import type { ComponentPropsWithRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn'

const card = cva(
  'rounded-panel border border-line bg-panel shadow-[0_3px_12px_#214f9c0d]',
  {
    variants: { compact: { true: '', false: 'p-4.5' } },
  },
)

type CardTag = 'div' | 'section' | 'header' | 'p' | 'form' | 'dialog'
type CardProps<Tag extends CardTag> = ComponentPropsWithRef<Tag> & {
  as?: Tag
  compact?: boolean
}

export function Card<Tag extends CardTag = 'div'>({
  as,
  compact = false,
  className = '',
  ...props
}: CardProps<Tag>) {
  return createElement(as ?? 'div', {
    ...props,
    className: cn(card({ compact }), className),
  })
}
