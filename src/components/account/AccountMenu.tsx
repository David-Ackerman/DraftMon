import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useLanguage } from '../../services/language'

import { accountErrors, accountLink, accountRequest } from '../../services/account'
import type { Account } from '../../services/account'

export function AccountMenu({ account, onChange }: { account: Account | null; onChange: (account: Account | null) => void }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [open])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const next = await accountRequest(account ? 'logout' : 'login', account ? undefined : { username, password })
      onChange(next)
      setPassword('')
      setOpen(false)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : ''
      setError(Object.hasOwn(accountErrors, message) ? t(message, accountErrors[message]) : t('Account service unavailable.', 'Serviço de contas indisponível.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="account-menu relative">
      <Button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {account?.username ?? t('Sign in', 'Entrar')}
      </Button>
      {open && <Card as="form" className="account-panel absolute [top:calc(100%_+_8px)] right-0 z-90 [width:min(290px,calc(100vw_-_32px))] lobby-form grid gap-3 content-start" onSubmit={submit}>
        <h2>{account ? t('Your account', 'Sua conta') : t('Sign in', 'Entrar')}</h2>
        {account ? <a href={accountLink('/email-da-conta')}>{account.email ? t('Change account email', 'Alterar e-mail da conta') : t('Add account email', 'Cadastrar e-mail da conta')}</a> : <>
          <label>{t('Username', 'Usuário')}
            <input required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>{t('Password', 'Senha')}
            <input required type="password" minLength={8} maxLength={128} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
        </>}
        {error && <p className="m-0 py-2.5 text-danger" role="alert">{error}</p>}
        <Button tone="primary" disabled={busy}>{account ? t('Sign out', 'Sair da conta') : t('Sign in', 'Entrar')}</Button>
        {!account && <>
          <a href={accountLink('/cadastro')}>{t('Create an account', 'Criar uma conta')}</a>
          <a href={accountLink('/recuperar-senha')}>{t('Forgot your password?', 'Esqueceu a senha?')}</a>
        </>}
      </Card>}
    </div>
  )
}
