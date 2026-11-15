'use client'

import dynamic from 'next/dynamic'
import type { accountRoutes } from '../services/account'

const loading = () => (
  <p className="mx-auto max-w-5xl px-4" role="status">
    Loading…
  </p>
)
const Play = dynamic(() => import('../screens/PlayScreen'), {
  ssr: false,
  loading,
})
const Lobby = dynamic(() => import('../screens/LobbyScreen'), {
  ssr: false,
  loading,
})
const Account = dynamic(() => import('../screens/AccountScreen'), {
  ssr: false,
  loading,
})

export function GameScreen({
  screen = 'play',
  room,
}: {
  screen?: 'play' | 'lobby' | keyof typeof accountRoutes
  room?: string
}) {
  if (screen === 'play') return <Play />
  if (screen === 'lobby') return <Lobby room={room} />
  return <Account route={screen} />
}
