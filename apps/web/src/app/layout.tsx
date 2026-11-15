import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { siteUrl } from './site'
import './globals.css'

export const metadata: Metadata = {
  ...(siteUrl && { metadataBase: siteUrl }),
  title: { default: 'Draftmon', template: '%s | Draftmon' },
  description:
    'Draft a Pokémon team by region and type, battle Gym Leaders and play tournaments with friends.',
  icons: { icon: '/pokeball.svg' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
