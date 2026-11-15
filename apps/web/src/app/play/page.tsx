import type { Metadata } from 'next'
import { GameScreen } from '../GameScreen'

export const metadata: Metadata = { title: 'Play', robots: { index: false } }

export default function Page() {
  return <GameScreen />
}
