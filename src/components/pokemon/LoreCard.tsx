import { useId } from 'react'
import type { ReactNode } from 'react'
import { useLanguage } from '../../services/language'

export function LoreCard({ entry, name, children, portrait, region = false }: {
  entry: [string, string, string, string]
  name: string
  children: ReactNode
  portrait?: string
  region?: boolean
}) {
  const id = useId()
  const { t } = useLanguage()
  const [games, generation, en, pt] = entry
  const card = <span className={`lore-popover${region ? ' lore-region' : ''}`} id={id} role="tooltip">
    {portrait && <span className="lore-portrait"><img src={portrait} alt="" width={region ? 320 : 128} height={region ? 216 : 128} /></span>}
    <strong>{name}</strong>
    <span className="text-brand text-[.73rem] font-bold">{t(region ? 'Introduced in Generation' : 'Debut generation', region ? 'Estreou na Geração' : 'Geração de estreia')} {generation}</span>
    <span className="text-brand text-[.73rem] font-bold">{games}</span>
    <span>{t(en, pt)}</span>
  </span>

  return (
    <span className="lore-anchor relative inline-flex min-w-0">
      <button type="button" className="lore-trigger [appearance:none] bg-transparent [border:0] p-0 text-[inherit] [font:inherit] rounded-lg cursor-help silent" aria-describedby={id} aria-label={name}
        onClick={(event) => event.currentTarget.focus()}
        onKeyDown={(event) => { if (event.key === 'Escape') event.currentTarget.blur() }}>
        {children}
      </button>
      {card}
    </span>
  )
}

export function AvatarLore({ entry, name, portrait }: { entry: [string, string, string, string]; name: string; portrait: string }) {
  return <LoreCard name={name} entry={entry} portrait={portrait}><span aria-hidden="true">ⓘ</span></LoreCard>
}
