import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { cn } from '../components/ui/cn'
import { headerControl } from '../components/ui/headerControl'
import { AppLayout } from '../components/layout/AppLayout'
import { RunProgress } from '../components/layout/RunProgress'
import { useSoloRun } from '../features/solo/useSoloRun'
import { Home } from './Home'
import { Draft } from '../components/draft/Draft'
import { Prep } from './Prep'
import { BattleView } from '../components/battle/BattleView'
import { RunEnd } from './RunEnd'
import { avatars, avatarSprite } from '../services/guest'
import { useLanguage } from '../services/language'
import { Pokedex } from './Pokedex'
import { usageIdentity } from '../services/pokemonUsage'
import { usePlayer } from '../features/player/usePlayer'

type Phase = 'home' | 'draft' | 'prep' | 'battle' | 'end' | 'pokedex'

export default function PlayScreen() {
  const { t } = useLanguage()
  const router = useRouter()
  const {
    name,
    guest,
    account,
    sessionReady,
    setAccount,
    changeName,
    changeAvatar,
    playerName,
  } = usePlayer()
  const [phase, setPhase] = useState<Phase>('home')
  const profileReturn = useRef<Phase>('home')
  const identity = usageIdentity(guest, account)
  const {
    run,
    battle,
    stats,
    startRun,
    pickCreature,
    reroll,
    startBattle,
    recordBattleUsage,
    finishBattle,
  } = useSoloRun(playerName, identity, setPhase)
  const goHome = () => {
    if (phase === 'home') router.push('/')
    else setPhase('home')
  }

  const renderScreen = () => {
    switch (phase) {
      case 'home':
        return (
          <Home
            stats={stats}
            name={name}
            guest={guest}
            onNameChange={changeName}
            onAvatarChange={changeAvatar}
            onStart={startRun}
            onLobby={() => router.push('/lobby')}
          />
        )
      case 'pokedex': {
        return (
          <Pokedex
            key={identity.owner}
            identity={identity}
            playerName={playerName}
            avatar={avatarSprite(guest.avatar)}
            onBack={() => setPhase(profileReturn.current)}
          />
        )
      }
      case 'draft':
        return run?.roll ? (
          <Draft
            key={run.team.length}
            run={run}
            onPick={pickCreature}
            onReroll={reroll}
          />
        ) : null
      case 'prep':
        return run ? <Prep run={run} onStart={startBattle} /> : null
      case 'battle':
        return run && battle ? (
          <BattleView
            result={battle}
            match={run.league[run.matchIndex]}
            playerName={playerName}
            playerSprite={avatarSprite(guest.avatar)}
            playerAvatar={
              avatars.find(({ id }) => id === guest.avatar) ?? avatars[0]
            }
            onComplete={recordBattleUsage}
            onDone={finishBattle}
          />
        ) : null
      case 'end':
        return run ? (
          <RunEnd
            run={run}
            playerName={playerName}
            onAgain={() => startRun('random')}
            onHome={() => setPhase('home')}
          />
        ) : null
    }
  }

  const progress =
    run && (phase === 'draft' || phase === 'prep' || phase === 'battle') ? (
      <RunProgress run={run} drafting={phase === 'draft'} />
    ) : null
  const profileAction = sessionReady &&
    (phase === 'home' || phase === 'end' || phase === 'pokedex') && (
      <button
        type="button"
        className={cn(
          headerControl,
          'pokedex-toggle aria-pressed:bg-accent aria-pressed:text-accent-ink',
        )}
        aria-label={t('My Pokédex', 'Minha Pokédex')}
        title={t('My Pokédex', 'Minha Pokédex')}
        aria-pressed={phase === 'pokedex'}
        data-close-header
        onClick={() => {
          if (phase === 'pokedex') {
            setPhase(profileReturn.current)
          } else {
            profileReturn.current = phase
            setPhase('pokedex')
          }
        }}
      >
        <Image
          src="/cursors/pokedex.png"
          alt=""
          width={24}
          height={24}
          className="shrink-0"
          unoptimized
          loading="eager"
        />
        <span>{t('Pokédex', 'Pokédex')}</span>
      </button>
    )
  return (
    <AppLayout
      account={account}
      sessionReady={sessionReady}
      onAccountChange={setAccount}
      onHome={goHome}
      progress={progress}
      profileAction={profileAction}
    >
      {renderScreen()}
    </AppLayout>
  )
}
