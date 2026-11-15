export interface Account {
  id: string
  username: string
  email: string | null
}

export const accountErrors: Record<string, string> = {
  'Incorrect username or password.': 'Usuário ou senha incorretos.',
  'That username is taken.': 'Esse nome de usuário já está em uso.',
  'Too many attempts. Try again in a minute.':
    'Muitas tentativas. Tente novamente em um minuto.',
  'Use a username with 3–24 letters, digits or underscores and a password with 8–128 characters.':
    'Use um nome com 3 a 24 letras, números ou sublinhados e uma senha com 8 a 128 caracteres.',
  'Enter a valid email address.': 'Digite um endereço de e-mail válido.',
  'That email is already linked to an account.':
    'Já existe uma conta vinculada a esse e-mail.',
  'This reset link is invalid or expired.':
    'Este link de redefinição é inválido ou expirou.',
  'Use a password with 8–128 characters.':
    'Use uma senha com 8 a 128 caracteres.',
  'Sign in to update your email.':
    'Entre na sua conta para atualizar seu e-mail.',
}

export const accountRoutes = {
  '/account/cadastro': 'register',
  '/account/recuperar-senha': 'recover',
  '/account/redefinir-senha': 'reset',
  '/account/email-da-conta': 'email',
} as const

export function accountLink(path: string) {
  const code =
    new URLSearchParams(window.location.search).get('room')?.toUpperCase() ?? ''
  const lobby = /^\/(?:lobby|tournament)\/([A-F0-9]{8})$/.exec(
    window.location.pathname,
  )?.[1]
  const invite = lobby ?? code
  const valid = /^[A-F0-9]{8}$/.test(invite)
  if (path === '/') return valid ? '/lobby/' + invite : '/play'
  const target = path.startsWith('/account/') ? path : '/account' + path
  return valid ? `${target}?room=${invite}` : target
}

export async function accountRequest(
  action: string,
  credentials?: Record<string, string>,
) {
  const data = await requestApi<{ account: Account | null }>(
    `/api/auth/${action}`,
    {
      method: action === 'session' ? 'GET' : 'POST',
      body: credentials,
      fallback: 'Account service unavailable.',
    },
  )
  return data.account
}
import { requestApi } from './api'
