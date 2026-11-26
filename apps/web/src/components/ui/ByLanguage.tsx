'use client'

import type { ReactNode } from 'react'
import { useLanguage } from '../../services/language'

/** Shows rich content in the player's language (English on the server). */
export function ByLanguage({ en, pt }: { en: ReactNode; pt: ReactNode }) {
  return useLanguage().language === 'pt-BR' ? pt : en
}
