import { useRouter } from 'next/navigation'
import { AppLayout } from '../components/layout/AppLayout'
import { useAccount } from '../features/player/usePlayer'
import { accountLink, accountRoutes } from '../services/account'
import { useLanguage } from '../services/language'
import { AccountPage } from './AccountPage'

export default function AccountScreen({
  route,
}: {
  route: keyof typeof accountRoutes
}) {
  const router = useRouter()
  const { t } = useLanguage()
  const { account, setAccount, sessionReady } = useAccount()
  const page = accountRoutes[route]
  return (
    <AppLayout
      accountPage
      account={account}
      sessionReady={sessionReady}
      onAccountChange={setAccount}
      onHome={() => router.push(accountLink('/'))}
    >
      {page === 'email' && !sessionReady ? (
        <p role="status">{t('Loading…', 'Carregando…')}</p>
      ) : (
        <AccountPage page={page} account={account} />
      )}
    </AppLayout>
  )
}
