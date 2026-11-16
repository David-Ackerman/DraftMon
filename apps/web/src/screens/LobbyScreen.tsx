import { useRouter } from 'next/navigation'
import { AppLayout } from '../components/layout/AppLayout'
import { usePlayer } from '../features/player/usePlayer'
import { Spinner } from '../components/ui/Spinner'
import { useLanguage } from '../services/language'
import { Lobby } from './Lobby'

export default function LobbyScreen({ room = '' }: { room?: string }) {
  const router = useRouter()
  const { t } = useLanguage()
  const { account, guest, playerName, sessionReady, setAccount } = usePlayer()
  const goHome = () => router.push('/play')

  return (
    <AppLayout
      account={account}
      sessionReady={sessionReady}
      onAccountChange={setAccount}
      onHome={goHome}
    >
      {sessionReady ? (
        <Lobby
          key={`${room}:${account?.id ?? guest.id}`}
          guest={guest}
          playerName={playerName}
          invite={room}
          onBack={goHome}
          onRoomChange={(code) => {
            if (code !== room) router.replace('/lobby/' + code)
          }}
        />
      ) : (
        <Spinner label={t('Loading the lobby…', 'Carregando o lobby…')} />
      )}
    </AppLayout>
  )
}
