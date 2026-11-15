import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GameScreen } from '../../GameScreen'

export const metadata: Metadata = {
  title: 'Tournament room',
  robots: { index: false },
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const room = (await params).id.toUpperCase()
  if (!/^[A-F0-9]{8}$/.test(room)) notFound()
  return <GameScreen screen="lobby" room={room} />
}
