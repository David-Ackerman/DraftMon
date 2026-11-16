import type { Metadata } from 'next'
import { Lilita_One, Nunito, Press_Start_2P } from 'next/font/google'
import type { ReactNode } from 'react'
import { siteUrl } from './site'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
})
const lilita = Lilita_One({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  variable: '--font-lilita',
  display: 'swap',
})
const pressStart = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-press-start',
  display: 'swap',
})

export const metadata: Metadata = {
  ...(siteUrl && { metadataBase: siteUrl }),
  title: { default: 'Draftmon', template: '%s | Draftmon' },
  description:
    'Draft a Pokémon team by region and type, battle Gym Leaders and play tournaments with friends.',
  icons: { icon: '/pokeball.svg' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${nunito.variable} ${lilita.variable} ${pressStart.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
