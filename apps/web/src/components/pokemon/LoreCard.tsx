import Image from 'next/image'
import { useId } from 'react'
import type { ReactNode } from 'react'
import { useLanguage } from '../../services/language'

export function LoreCard({
  entry,
  name,
  children,
  portrait,
  region = false,
}: {
  entry: [string, string, string, string]
  name: string
  children: ReactNode
  portrait?: string
  region?: boolean
}) {
  const id = useId()
  const { t } = useLanguage()
  const [games, generation, en, pt] = entry
  const card = (
    <span
      className={`lore-popover absolute [top:calc(100%_+_3px)] left-0 z-80 hidden [width:min(255px,calc(100vw_-_36px))] cursor-auto rounded-[11px] bg-panel [padding:12px] text-left text-[.8rem] [line-height:1.45] text-ink shadow-[0_8px_22px_#18244a33] [border:1px_solid_var(--line)] [&_strong]:text-[1rem] [&.lore-region]:[width:min(348px,calc(100vw_-_36px))] compact-layout:[&.lore-region]:fixed compact-layout:[&.lore-region]:[inset:auto_16px_16px] compact-layout:[&.lore-region]:w-auto ${region ? 'lore-region' : ''}`}
      id={id}
      role="tooltip"
    >
      {portrait && (
        <span className="mb-[5px] grid place-items-center rounded-[8px] [background:radial-gradient(ellipse,#fff6ca,var(--card2)_75%)]">
          <Image
            src={portrait}
            alt=""
            width={region ? 320 : 128}
            height={region ? 216 : 128}
            className={
              region
                ? 'h-[min(216px,32dvh)] w-full object-contain'
                : 'size-32 object-contain [image-rendering:pixelated]'
            }
            unoptimized
            loading="eager"
          />
        </span>
      )}
      <strong>{name}</strong>
      <span className="text-[.73rem] font-bold text-brand">
        {t(
          region ? 'Introduced in Generation' : 'Debut generation',
          region ? 'Estreou na Geração' : 'Geração de estreia',
        )}{' '}
        {generation}
      </span>
      <span className="text-[.73rem] font-bold text-brand">{games}</span>
      <span>{t(en, pt)}</span>
    </span>
  )

  return (
    <span className="lore-anchor relative inline-flex min-w-0 compact-layout:[&_.lore-popover]:fixed compact-layout:[&_.lore-popover]:[inset:auto_16px_16px] compact-layout:[&_.lore-popover]:w-auto [&:focus-within_>_.lore-popover]:grid [&:focus-within_>_.lore-popover]:gap-[3px] [&:hover_>_.lore-popover]:grid [&:hover_>_.lore-popover]:gap-[3px]">
      <button
        type="button"
        className="lore-trigger silent cursor-help [appearance:none] rounded-lg border-0 bg-transparent p-0 text-[inherit] [font:inherit] [&:focus-visible]:[outline:2px_solid_var(--blue)] [&:focus-visible]:[outline-offset:2px]"
        aria-describedby={id}
        aria-label={name}
        onClick={(event) => event.currentTarget.focus()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') event.currentTarget.blur()
        }}
      >
        {children}
      </button>
      {card}
    </span>
  )
}

export function AvatarLore({
  entry,
  name,
  portrait,
}: {
  entry: [string, string, string, string]
  name: string
  portrait: string
}) {
  return (
    <LoreCard name={name} entry={entry} portrait={portrait}>
      <span aria-hidden="true">ⓘ</span>
    </LoreCard>
  )
}
