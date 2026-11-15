import { Button } from './components/ui/Button'
import { useEffect, useRef, useState } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { RunProgress } from './components/layout/RunProgress'
import { useSoloRun } from './features/solo/useSoloRun'
import { loadName, saveName } from './services/storage'
import { Home } from './pages/Home'
import { Draft } from './components/draft/Draft'
import { Prep } from './pages/Prep'
import { BattleView } from './components/battle/BattleView'
import { RunEnd } from './pages/RunEnd'
import { avatars, avatarSprite, loadGuest, saveGuest } from './services/guest'
import { Lobby } from './pages/Lobby'
import { useLanguage } from './services/language'
import { AccountPage } from './pages/AccountPage'
import { accountLink, accountRequest, accountRoutes } from './services/account'
import type { Account } from './services/account'
import { Pokedex } from './pages/Pokedex'
import { usageIdentity } from './services/pokemonUsage'

type Phase = 'home' | 'lobby' | 'draft' | 'prep' | 'battle' | 'end' | 'pokedex'

const roomCode = () => {
  const code = new URLSearchParams(window.location.search).get('room')?.toUpperCase() ?? ''
  return /^[A-F0-9]{8}$/.test(code) ? code : ''
}

function writeRoomCode(code: string) {
  const url = new URL(window.location.href)
  if (code) url.searchParams.set('room', code)
  else url.searchParams.delete('room')
  window.history.replaceState(null, '', url)
}

export default function App() {
  const { t } = useLanguage()
  const pathname = window.location.pathname
  const accountPage = Object.hasOwn(accountRoutes, pathname) ? accountRoutes[pathname as keyof typeof accountRoutes] : undefined
  const [invite, setInvite] = useState(roomCode)
  const [phase, setPhase] = useState<Phase>(invite ? 'lobby' : 'home')
  const [name, setName] = useState(loadName)
  const [guest, setGuest] = useState(loadGuest)
  const [account, setAccount] = useState<Account | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const profileReturn = useRef<Phase>('home')
  const playerName = name.trim() || account?.username || t('Player', 'Treinador')
  const identity = usageIdentity(guest, account)
  const { run, battle, stats, startRun, pickCreature, reroll, startBattle, recordBattleUsage, finishBattle } =
    useSoloRun(playerName, identity, setPhase)
  useEffect(() => {
    let cancelled = false
    void accountRequest('session').then((current) => { if (!cancelled) setAccount(current) })
      .catch(() => {}).finally(() => { if (!cancelled) setSessionReady(true) })
    return () => { cancelled = true }
  }, [])

  const changeName = (n: string) => {
    setName(n)
    saveName(n)
  }

  const changeAvatar = (avatar: string) => {
    const profile = { ...guest, avatar }
    setGuest(profile)
    saveGuest(profile)
  }

  const goHome = () => {
    if (accountPage) {
      window.location.assign(accountLink('/'))
      return
    }
    writeRoomCode('')
    setPhase('home')
  }

  const renderScreen = () => {
    switch (phase) {
      case 'home':
        return <Home stats={stats} name={name} guest={guest} onNameChange={changeName} onAvatarChange={changeAvatar} onStart={startRun} onLobby={() => setPhase('lobby')} />
      case 'pokedex': {
        return <Pokedex key={identity.owner} identity={identity} playerName={playerName} avatar={avatarSprite(guest.avatar)} onBack={() => setPhase(profileReturn.current)} />
      }
      case 'lobby':
        if (!sessionReady) return <p role="status">{t('Loading…', 'Carregando…')}</p>
        return <Lobby key={account?.id ?? guest.id} signedIn={!!account} guest={guest} playerName={playerName} invite={invite} onRoomChange={(code) => {
          setInvite(code)
          writeRoomCode(code)
        }} onBack={goHome} />
      case 'draft':
        return run?.roll ? <Draft key={run.team.length} run={run} onPick={pickCreature} onReroll={reroll} /> : null
      case 'prep':
        return run ? <Prep run={run} onStart={startBattle} /> : null
      case 'battle':
        return run && battle ? (
          <BattleView result={battle} match={run.league[run.matchIndex]} playerName={playerName} playerSprite={avatarSprite(guest.avatar)}
            playerAvatar={avatars.find(({ id }) => id === guest.avatar) ?? avatars[0]} onComplete={recordBattleUsage} onDone={finishBattle} />
        ) : null
      case 'end':
        return run ? (
          <RunEnd run={run} playerName={playerName} onAgain={() => startRun('random')} onHome={() => setPhase('home')} />
        ) : null
    }
  }

  const progress = run && (phase === 'draft' || phase === 'prep' || phase === 'battle')
    ? <RunProgress run={run} drafting={phase === 'draft'} />
    : null
  const profileAction = sessionReady && !accountPage && (phase === 'home' || phase === 'end' || phase === 'pokedex') &&
    <Button icon size="custom" className="pokedex-toggle inline-flex h-9 w-auto items-center gap-1 rounded-lg text-[.75rem] font-bold [font-family:inherit] [line-height:inherit]"
      aria-label={t('My Pokédex', 'Minha Pokédex')} title={t('My Pokédex', 'Minha Pokédex')} aria-pressed={phase === 'pokedex'}
      onClick={() => {
        if (phase === 'pokedex') {
          setPhase(profileReturn.current)
        } else {
          profileReturn.current = phase
          setPhase('pokedex')
        }
      }}>
      <img src="/cursors/pokedex.png" alt="" width={24} height={24} />
      <span>{t('Pokédex', 'Pokédex')}</span>
    </Button>
  return (
    <AppLayout accountPage={Boolean(accountPage)} account={account} sessionReady={sessionReady}
      onAccountChange={setAccount} onHome={goHome} progress={progress} profileAction={profileAction}>
      {accountPage === 'email' && !sessionReady
        ? <p role="status">{t('Loading…', 'Carregando…')}</p>
        : accountPage ? <AccountPage page={accountPage} account={account} /> : renderScreen()}
    </AppLayout>
  )
}
