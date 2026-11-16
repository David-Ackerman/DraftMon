'use client'

import dynamic from 'next/dynamic'
import { LoadingShell } from '../components/layout/LoadingShell'
import type { accountRoutes } from '../services/account'

// The screens read browser-only state (saved runs, the session), so they
// render on the client. Until their code arrives, the shell paints the real
// header and footer with a spinner where the content will appear.
const loading = () => <LoadingShell />
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
