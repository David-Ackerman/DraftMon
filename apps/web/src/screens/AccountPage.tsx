import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  accountErrors,
  accountLink,
  accountRequest,
  accountRoutes,
} from '../services/account'
import type { Account } from '../services/account'
import { setLanguage, useLanguage } from '../services/language'

type Page = (typeof accountRoutes)[keyof typeof accountRoutes]

export function AccountPage({
  page,
  account,
}: {
  page: Page
  account: Account | null
}) {
  const { language, t } = useLanguage()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [link] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)),
  )
  const token = link.get('token') ?? ''
  const register = page === 'register'
  const recover = page === 'recover'
  const reset = page === 'reset'
  const emailPage = page === 'email'
  const invalidLink = reset && !/^[a-f0-9]{64}$/.test(token)
  const title = {
    register: t('Create account', 'Criar conta'),
    recover: t('Recover your password', 'Recuperar senha'),
    reset: t('Choose a new password', 'Definir nova senha'),
    email: t('Account email', 'E-mail da conta'),
  }[page]

  useEffect(() => {
    if (page !== 'reset') return
    const requested = link.get('lang')
    if (requested === 'pt-BR' || requested === 'en') setLanguage(requested)
  }, [page, link])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = Object.fromEntries(
      new FormData(event.currentTarget),
    ) as Record<string, string>
    if (reset && fields.password !== fields.confirm) {
      setError(t('Passwords do not match.', 'As senhas não coincidem.'))
      return
    }
    delete fields.confirm
    setError('')
    setBusy(true)
    try {
      await accountRequest(page, {
        ...fields,
        language,
        ...(reset && { token }),
      })
      if (register || emailPage) window.location.assign(accountLink('/'))
      else {
        if (reset)
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search,
          )
        setDone(true)
      }
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
    <Card
      as="section"
      className="account-page mx-auto my-9 grid [width:min(100%,440px)] gap-5 [&_a]:text-ink [&_a]:[text-underline-offset:3px] [&_h1]:m-0 [&_p]:m-0"
    >
      <h1>{title}</h1>
      {done ? (
        <p role="status">
          {recover
            ? t(
                'If an account uses this address, a password reset link will be sent.',
                'Se houver uma conta vinculada a esse e-mail, você receberá um link para redefinir a senha.',
              )
            : t(
                'Password updated. Sign in with your new password.',
                'Senha atualizada. Entre com sua nova senha.',
              )}
        </p>
      ) : invalidLink ? (
        <p role="alert">
          {t(
            'This reset link is invalid or expired.',
            'Este link de redefinição é inválido ou expirou.',
          )}
        </p>
      ) : emailPage && !account ? (
        <p>
          {t(
            'Sign in to update your email.',
            'Entre na sua conta para atualizar seu e-mail.',
          )}
        </p>
      ) : (
        <form
          className="lobby-form grid content-start gap-3 [&_.tournament-checkbox]:flex [&_.tournament-checkbox]:items-center [&_.tournament-checkbox]:gap-[7px] [&_input]:min-h-12 [&_input]:w-full [&_input]:rounded-xl [&_input]:bg-panel-muted [&_input]:[padding:0_14px] [&_input]:[font-family:inherit] [&_input]:font-extrabold [&_input]:text-ink [&_input]:[border:3px_solid_var(--outline)] [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[.85rem] [&_label]:font-black [&_select]:min-h-12 [&_select]:w-full [&_select]:rounded-xl [&_select]:bg-panel-muted [&_select]:[padding:0_10px] [&_select]:[font-family:inherit] [&_select]:font-extrabold [&_select]:text-ink [&_select]:[border:3px_solid_var(--outline)]"
          onSubmit={submit}
        >
          {register && (
            <label>
              {t('Username', 'Usuário')}
              <input
                name="username"
                required
                minLength={3}
                maxLength={24}
                pattern="[A-Za-z0-9_]{3,24}"
                autoComplete="username"
              />
            </label>
          )}
          {!reset && (
            <label>
              {t('Email', 'E-mail')}
              <input
                type="email"
                name="email"
                required
                maxLength={254}
                autoComplete="email"
                defaultValue={emailPage ? (account?.email ?? '') : ''}
              />
            </label>
          )}
          {!recover && (
            <label>
              {emailPage
                ? t('Current password', 'Senha atual')
                : reset
                  ? t('New password', 'Nova senha')
                  : t('Password', 'Senha')}
              <input
                type="password"
                name="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete={emailPage ? 'current-password' : 'new-password'}
              />
            </label>
          )}
          {reset && (
            <label>
              {t('Confirm new password', 'Confirme a nova senha')}
              <input
                type="password"
                name="confirm"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
          )}
          {error && (
            <p className="m-0 py-2.5 text-danger" role="alert">
              {error}
            </p>
          )}
          <Button tone="primary" disabled={busy}>
            {register
              ? title
              : recover
                ? t('Send reset link', 'Enviar link de recuperação')
                : reset
                  ? t('Save new password', 'Salvar nova senha')
                  : t('Save email', 'Salvar e-mail')}
          </Button>
        </form>
      )}
      <div className="flex flex-wrap gap-x-4.5 gap-y-2">
        <a href={accountLink('/')}>
          {t('Back to Draftmon', 'Voltar ao Draftmon')}
        </a>
        {reset && !done && (
          <a href={accountLink('/recuperar-senha')}>
            {t('Request a new link', 'Pedir outro link')}
          </a>
        )}
      </div>
    </Card>
  )
}
