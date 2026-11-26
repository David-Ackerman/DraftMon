'use client'

import { useLanguage } from '../../services/language'
import { DARK_TEXT, TYPE_COLORS } from './typeColors'

/** A localized, colored type pill that also works inside server pages. */
export function TypeTag({ type }: { type: string }) {
  const { typeLabel } = useLanguage()
  return (
    <span
      className="inline-block rounded-full border-2 border-outline px-2.5 py-0.5 align-middle text-[.72rem] font-extrabold tracking-[.05em] uppercase"
      style={{
        background: TYPE_COLORS[type] ?? '#888',
        color: DARK_TEXT.has(type) ? '#14204a' : '#fff',
      }}
    >
      {typeLabel(type)}
    </span>
  )
}
