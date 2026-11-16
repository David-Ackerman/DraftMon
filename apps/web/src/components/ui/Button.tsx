import type { ComponentPropsWithoutRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn'

const regular = cva(
  'btn inline-flex cursor-pointer items-center justify-center gap-2 border-3 border-outline font-display leading-[1.15] tracking-[.01em] shadow-[0_4px_0_var(--outline)] [transition:transform_.08s,box-shadow_.08s,background_.15s] enabled:active:translate-y-[3px] enabled:active:shadow-[0_1px_0_var(--outline)] disabled:cursor-not-allowed disabled:opacity-40',
  {
    variants: {
      tone: {
        default:
          'bg-panel-muted text-ink enabled:hover:bg-[#dce8ff] dark:enabled:hover:bg-[#33406b]',
        primary: 'primary bg-accent text-accent-ink enabled:hover:bg-[#ffd84a]',
        danger: 'danger bg-[#dc3445] text-white',
      },
      size: {
        default: 'min-h-11 rounded-xl px-4 py-2 text-[1rem]',
        large:
          'min-h-14 rounded-2xl px-6 py-3 text-[1.25rem] shadow-[0_5px_0_var(--outline)]',
        custom: '',
      },
    },
  },
)

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  tone?: 'default' | 'primary' | 'danger'
  size?: 'default' | 'large' | 'custom'
  icon?: boolean
}

export function Button({
  tone = 'default',
  size = 'default',
  icon = false,
  className = '',
  ...props
}: ButtonProps) {
  const appearance = icon
    ? cn(
        'icon-btn cursor-pointer border-2 border-outline bg-panel-muted text-ink disabled:cursor-default disabled:opacity-30',
        size !== 'custom' && 'h-7 w-8 rounded-lg text-[.7rem]',
      )
    : regular({ tone, size })
  return <button {...props} className={cn(appearance, className)} />
}
