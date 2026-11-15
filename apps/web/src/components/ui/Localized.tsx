'use client'

import { useLanguage } from '../../services/language'

export function Localized({ en, pt }: { en: string; pt: string }) {
  return useLanguage().t(en, pt)
}
