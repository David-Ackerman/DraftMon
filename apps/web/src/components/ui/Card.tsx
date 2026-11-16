import { createElement } from 'react'
import type { ComponentPropsWithRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn'

const card = cva(
  'rounded-panel border-3 border-outline bg-panel shadow-[5px_5px_0_var(--outline)]',
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
