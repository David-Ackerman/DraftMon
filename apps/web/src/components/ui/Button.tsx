import type { ComponentPropsWithoutRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn'

const regular = cva(
  'btn inline-flex cursor-pointer items-center justify-center gap-2 border font-[inherit] leading-[inherit] font-semibold [transition:transform_.08s,background_.15s,border-color_.15s] enabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40',
  {
    variants: {
      tone: {
        default:
          'border-line bg-panel-muted text-ink enabled:hover:border-[#5380c7] enabled:hover:bg-[#dce8ff] dark:enabled:hover:bg-[#344260]',
        primary:
          'primary border-brand bg-accent text-accent-ink enabled:hover:bg-[#ffd866]',
        danger:
          'danger border-danger bg-danger text-white dark:text-accent-ink',
      },
      size: {
        default: 'rounded-[10px] px-3.5 py-[9px] [font-size:inherit]',
        large: 'rounded-[10px] px-[22px] py-[13px] text-[1.05rem]',
        custom: '',
      },
    },
    compoundVariants: [
      {
        tone: 'primary',
        size: ['default', 'large'],
        class: 'shadow-[inset_0_-2px_0_#bf890030]',
      },
    ],
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
        'icon-btn cursor-pointer border border-line bg-panel-muted text-ink disabled:cursor-default disabled:opacity-30',
        size !== 'custom' && 'h-7 w-8 rounded-lg text-[.7rem]',
      )
    : regular({ tone, size })
  return <button {...props} className={cn(appearance, className)} />
}
