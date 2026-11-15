import type { ComponentPropsWithoutRef } from 'react'

const tones = {
  default: 'border-line bg-panel-muted text-ink enabled:hover:border-[#5380c7] enabled:hover:bg-[#dce8ff] dark:enabled:hover:bg-[#344260]',
  primary: 'primary border-brand bg-accent text-accent-ink enabled:hover:bg-[#ffd866]',
  danger: 'danger border-danger bg-danger text-white dark:text-accent-ink',
}

const sizes = {
  default: 'rounded-[10px] px-3.5 py-[9px] [font-size:inherit]',
  large: 'rounded-[10px] px-[22px] py-[13px] text-[1.05rem]',
  custom: '',
}

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  tone?: keyof typeof tones
  size?: keyof typeof sizes
  icon?: boolean
}

export function Button({ tone = 'default', size = 'default', icon = false, className = '', ...props }: ButtonProps) {
  const base = icon
    ? 'icon-btn cursor-pointer border border-line bg-panel-muted text-ink disabled:cursor-default disabled:opacity-30'
    : 'btn inline-flex cursor-pointer items-center justify-center gap-2 border font-semibold [font-family:inherit] [line-height:inherit] [transition:transform_.08s,background_.15s,border-color_.15s] enabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40'
  const appearance = icon ? (size === 'custom' ? '' : 'h-7 w-8 rounded-lg text-[.7rem]') : `${tones[tone]} ${sizes[size]}`
  const shadow = !icon && tone === 'primary' && size !== 'custom' ? 'shadow-[inset_0_-2px_0_#bf890030]' : ''
  return <button {...props} className={`${base} ${appearance} ${shadow} ${className}`} />
}
