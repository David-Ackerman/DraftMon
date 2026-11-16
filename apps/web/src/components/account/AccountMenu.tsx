import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { headerControl } from '../ui/headerControl'
import { Card } from '../ui/Card'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useLanguage } from '../../services/language'

import {
  accountErrors,
  accountLink,
  accountRequest,
} from '../../services/account'
import type { Account } from '../../services/account'

export function AccountMenu({
  account,
  onChange,
}: {
  account: Account | null
  onChange: (account: Account | null) => void
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [open])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const next = await accountRequest(
        account ? 'logout' : 'login',
        account ? undefined : { username, password },
      )
      onChange(next)
      setPassword('')
      setOpen(false)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : ''
      setError(
        Object.hasOwn(accountErrors, message)
          ? t(message, accountErrors[message])
          : t(
              'Account service unavailable.',
              'Serviço de contas indisponível.',
            ),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="account-menu relative">
      <button
        type="button"
        className={cn(
          headerControl,
          'max-w-40 px-3.5 phone-header:max-w-[120px]',
          !account && 'bg-accent text-accent-ink',
        )}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">
          {account?.username ?? t('Sign in', 'Entrar')}
        </span>
      </button>
      {open && (
        <Card
          as="form"
          className="account-panel lobby-form absolute [top:calc(100%_+_8px)] right-0 z-90 grid [width:min(290px,calc(100vw_-_32px))] content-start gap-3 [&_.tournament-checkbox]:flex [&_.tournament-checkbox]:items-center [&_.tournament-checkbox]:gap-[7px] [&_a]:text-ink [&_a]:[text-underline-offset:3px] [&_input]:min-h-12 [&_input]:w-full [&_input]:rounded-xl [&_input]:bg-panel-muted [&_input]:[padding:0_14px] [&_input]:[font-family:inherit] [&_input]:font-extrabold [&_input]:text-ink [&_input]:[border:3px_solid_var(--outline)] [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[.85rem] [&_label]:font-black [&_select]:min-h-12 [&_select]:w-full [&_select]:rounded-xl [&_select]:bg-panel-muted [&_select]:[padding:0_10px] [&_select]:[font-family:inherit] [&_select]:font-extrabold [&_select]:text-ink [&_select]:[border:3px_solid_var(--outline)]"
          onSubmit={submit}
        >
          <h2>
            {account ? t('Your account', 'Sua conta') : t('Sign in', 'Entrar')}
          </h2>
          {account ? (
            <a href={accountLink('/email-da-conta')}>
              {account.email
                ? t('Change account email', 'Alterar e-mail da conta')
                : t('Add account email', 'Cadastrar e-mail da conta')}
            </a>
          ) : (
            <>
              <label>
                {t('Username', 'Usuário')}
                <input
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[A-Za-z0-9_]{3,24}"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
              <label>
                {t('Password', 'Senha')}
                <input
                  required
                  type="password"
                  minLength={8}
                  maxLength={128}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
            </>
          )}
          {error && (
            <p className="m-0 py-2.5 text-danger" role="alert">
              {error}
            </p>
          )}
          <Button tone="primary" disabled={busy}>
            {account ? t('Sign out', 'Sair da conta') : t('Sign in', 'Entrar')}
          </Button>
          {!account && (
            <>
              <a href={accountLink('/cadastro')}>
                {t('Create an account', 'Criar uma conta')}
              </a>
              <a href={accountLink('/recuperar-senha')}>
                {t('Forgot your password?', 'Esqueceu a senha?')}
              </a>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
