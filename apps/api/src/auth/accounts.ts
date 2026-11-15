import { createHash, randomBytes } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { hashPassword, verifyPassword } from './password'
import { fail } from '../http'
import type { HttpReply } from '../http'
import type { Account, Accounts, AccountStore, Store } from '../models'

const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const TOKEN = 'poke_session'
const SESSION_AGE = 60 * 60 * 24 * 14
const randomHex = (size: number) => randomBytes(size).toString('hex')
const passwordValid = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 8 && value.length <= 128
const emailAddress = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''
const emailValid = (value: string) =>
  value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const RESET_AGE = 30 * 60_000

export type ResetMailer = (
  email: string,
  token: string,
  language: 'en' | 'pt-BR',
) => Promise<void> | void

function resetMailer(): ResetMailer | null {
  const { RESEND_API_KEY, POKE_BATTLE_MAIL_FROM, PUBLIC_APP_URL } = process.env
  if (!RESEND_API_KEY || !POKE_BATTLE_MAIL_FROM || !PUBLIC_APP_URL) return null
  const base = new URL(PUBLIC_APP_URL)
  if (base.protocol !== 'https:')
    throw new Error('PUBLIC_APP_URL must use HTTPS.')
  return async (email, token, language) => {
    const url = new URL('/account/redefinir-senha', base)
    url.hash = new URLSearchParams({ token, lang: language }).toString()
    const pt = language === 'pt-BR'
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: POKE_BATTLE_MAIL_FROM,
        to: [email],
        subject: pt
          ? 'Draftmon · Redefinição de senha'
          : 'Draftmon · Password reset',
        text: pt
          ? `Use este link para redefinir sua senha. Ele expira em 30 minutos. Se você não fez o pedido, ignore esta mensagem.\n\n${url}`
          : `Use this link to reset your password. It expires in 30 minutes. If you didn't request it, ignore this message.\n\n${url}`,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok)
      throw new Error(`Mail provider returned ${response.status}.`)
  }
}

export function createAccounts(
  store: Store<AccountStore>,
  {
    sendReset = resetMailer(),
    clock = Date.now,
    afterCommit = setImmediate,
  }: {
    sendReset?: ResetMailer | null
    clock?: () => number
    afterCommit?: (callback: () => void) => unknown
  } = {},
) {
  const attempts = new Map<string, { expires: number; count: number }>()

  const sessionKey = (request: IncomingMessage) => {
    const cookie = request.headers.cookie
      ?.split(';')
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${TOKEN}=`))
      ?.slice(TOKEN.length + 1)
    return cookie && /^[a-f0-9]{64}$/.test(cookie) ? hash(cookie) : null
  }

  function identify(request: IncomingMessage) {
    const key = sessionKey(request)
    if (!key) return null
    const { users, sessions } = store.read()
    const session = sessions[key]
    if (!session || session.expires <= clock()) return null
    const account = users[session.username]
    return account ? { id: account.id, username: session.username } : null
  }

  function privateAccount(account: Account, username: string) {
    return { id: account.id, username, email: account.email ?? null }
  }

  function checkEmail(users: Accounts, email: string, username: string) {
    if (!emailValid(email)) fail(400, 'Enter a valid email address.')
    if (
      Object.entries(users).some(
        ([name, account]) => name !== username && account.email === email,
      )
    ) {
      fail(409, 'That email is already linked to an account.')
    }
  }

  function cookie(
    request: IncomingMessage,
    response: HttpReply,
    token: string,
    age: number,
  ) {
    const secure =
      ('encrypted' in request.socket && request.socket.encrypted) ||
      process.env.POKE_BATTLE_SECURE_COOKIES === '1'
    response.setHeader(
      'Set-Cookie',
      `${TOKEN}=${token}; Path=/; Max-Age=${age}; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`,
    )
  }

  function createSession(
    request: IncomingMessage,
    response: HttpReply,
    users: Accounts,
    username: string,
  ) {
    const token = randomHex(32)
    const now = clock()
    const key = sessionKey(request)
    const sessions = Object.fromEntries(
      Object.entries(store.read().sessions).filter(
        ([id, value]) => id !== key && value.expires > now,
      ),
    )
    sessions[hash(token)] = { username, expires: now + SESSION_AGE * 1000 }
    store.write({ users, sessions })
    cookie(request, response, token, SESSION_AGE)
    return { account: privateAccount(users[username], username) }
  }

  async function handle(
    request: IncomingMessage,
    response: HttpReply,
    path: string,
    body: Record<string, unknown> = {},
  ) {
    if (path === '/api/auth/session' && request.method === 'GET') {
      const account = identify(request)
      return {
        account: account
          ? privateAccount(
              store.read().users[account.username],
              account.username,
            )
          : null,
      }
    }
    if (request.method !== 'POST') fail(405, 'Action not available.')
    if (path === '/api/auth/logout') {
      const key = sessionKey(request)
      const state = store.read()
      if (key && state.sessions[key]) {
        const sessions = { ...state.sessions }
        delete sessions[key]
        store.write({ ...state, sessions })
      }
      cookie(request, response, '', 0)
      return { account: null }
    }
    const signup = path === '/api/auth/register'
    const recover = path === '/api/auth/recover'
    const reset = path === '/api/auth/reset'
    const changeEmail = path === '/api/auth/email'
    if (
      !signup &&
      !recover &&
      !reset &&
      !changeEmail &&
      path !== '/api/auth/login'
    )
      fail(404, 'Action not available.')
    const { username: input, password, email: rawEmail, token, language } = body
    const email = emailAddress(rawEmail)
    const now = clock()
    for (const [address, entry] of attempts)
      if (entry.expires <= now) attempts.delete(address)
    const address = `${path}:${request.socket.remoteAddress ?? 'local'}`
    const limit = attempts.get(address) ?? { expires: now + 60_000, count: 0 }
    if (++limit.count > 12)
      fail(429, 'Too many attempts. Try again in a minute.')
    attempts.set(address, limit)

    if (recover) {
      if (!emailValid(email)) fail(400, 'Enter a valid email address.')
      const { users, sessions } = store.read()
      const found = Object.entries(users).find(
        ([, account]) => account.email === email,
      )
      if (sendReset && found && now - (found[1].reset?.issued ?? 0) >= 60_000) {
        const [username, account] = found
        const token = randomHex(32)
        store.write({
          users: {
            ...users,
            [username]: {
              ...account,
              reset: {
                hash: hash(token),
                issued: now,
                expires: now + RESET_AGE,
              },
            },
          },
          sessions,
        })
        afterCommit(() => {
          void Promise.resolve()
            .then(() =>
              sendReset(email, token, language === 'pt-BR' ? 'pt-BR' : 'en'),
            )
            .catch(() =>
              console.error('Draftmon password reset email delivery failed.'),
            )
        })
      }
      return { account: null }
    }

    if (reset) {
      if (!passwordValid(password))
        fail(400, 'Use a password with 8–128 characters.')
      const invalid = (): never =>
        fail(400, 'This reset link is invalid or expired.')
      if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token))
        return invalid()
      const key = hash(token)
      const found = Object.entries(store.read().users).find(
        ([, account]) =>
          account.reset?.hash === key && account.reset.expires > now,
      )
      if (!found) return invalid()
      const [username] = found
      const digest = await hashPassword(password)
      const { users, sessions } = store.read()
      const account = users[username]
      if (account.reset?.hash !== key || account.reset.expires <= clock())
        invalid()
      const updated = { ...account, password: digest }
      delete updated.salt
      delete updated.reset
      store.write({
        users: { ...users, [username]: updated },
        sessions: Object.fromEntries(
          Object.entries(sessions).filter(
            ([, session]) => session.username !== username,
          ),
        ),
      })
      return { account: null }
    }

    const current = changeEmail ? identify(request) : null
    if (changeEmail && !current) fail(401, 'Sign in to update your email.')
    const username =
      current?.username ??
      (typeof input === 'string' ? input.trim().toLowerCase() : '')
    if (!/^[a-z0-9_]{3,24}$/.test(username) || !passwordValid(password)) {
      fail(
        400,
        'Use a username with 3–24 letters, digits or underscores and a password with 8–128 characters.',
      )
    }
    const existing = Object.hasOwn(store.read().users, username)
      ? store.read().users[username]
      : undefined
    const { users } = store.read()
    if (signup) {
      if (Object.hasOwn(users, username)) fail(409, 'That username is taken.')
      checkEmail(users, email, username)
      const account = {
        id: randomHex(6).toUpperCase(),
        email,
        password: await hashPassword(password),
      }
      return createSession(
        request,
        response,
        { ...users, [username]: account },
        username,
      )
    }
    if (!(await verifyPassword(password, existing))) {
      fail(401, 'Incorrect username or password.')
    }
    if (changeEmail) {
      if (!identify(request)) fail(401, 'Sign in to update your email.')
      checkEmail(users, email, username)
      const updated = { ...users[username], email }
      delete updated.reset
      store.write({ ...store.read(), users: { ...users, [username]: updated } })
      return { account: privateAccount(updated, username) }
    }
    return createSession(request, response, users, username)
  }

  return { identify, handle }
}
