import type { Metadata } from 'next'
import { GameScreen } from '../GameScreen'

export const metadata: Metadata = { title: 'Lobby', robots: { index: false } }

export default function Page() {
  return <GameScreen screen="lobby" />
}
