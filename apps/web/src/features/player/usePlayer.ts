import { useEffect, useState } from 'react'
import { accountRequest } from '../../services/account'
import type { Account } from '../../services/account'
import { loadGuest, saveGuest } from '../../services/guest'
import { useLanguage } from '../../services/language'
import { loadName, saveName } from '../../services/storage'

export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    void accountRequest('session')
      .then((current) => {
        if (!cancelled) setAccount(current)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSessionReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])
  return { account, setAccount, sessionReady }
}

export function usePlayer() {
  const { t } = useLanguage()
  const session = useAccount()
  const [name, setName] = useState(loadName)
  const [guest, setGuest] = useState(loadGuest)
  return {
    ...session,
    name,
    guest,
    playerName:
      name.trim() || session.account?.username || t('Player', 'Treinador'),
    changeName(value: string) {
      setName(value)
      saveName(value)
    },
    changeAvatar(avatar: string) {
      const profile = { ...guest, avatar }
      setGuest(profile)
      saveGuest(profile)
    },
  }
}
