import type { Metadata } from 'next'
import { GameScreen } from '../../GameScreen'

export const metadata: Metadata = { title: 'Account', robots: { index: false } }

export default function Page() {
  return <GameScreen screen="/account/email-da-conta" />
}
