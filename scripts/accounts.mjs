import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { fail, jsonStore, readBody } from './http-store.mjs'

const derive = promisify(scrypt)
const hash = (value) => createHash('sha256').update(value).digest('hex')
const TOKEN = 'poke_session'
const SESSION_AGE = 60 * 60 * 24 * 14
const randomHex = (size) => randomBytes(size).toString('hex')
const passwordValid = (value) => typeof value === 'string' && value.length >= 8 && value.length <= 128
const emailAddress = (value) => typeof value === 'string' ? value.trim().toLowerCase() : ''
const emailValid = (value) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const RESET_AGE = 30 * 60_000

function resetMailer() {
  const { RESEND_API_KEY, POKE_BATTLE_MAIL_FROM, PUBLIC_APP_URL } = process.env
  if (!RESEND_API_KEY || !POKE_BATTLE_MAIL_FROM || !PUBLIC_APP_URL) return null
  const base = new URL(PUBLIC_APP_URL)
  if (base.protocol !== 'https:') throw new Error('PUBLIC_APP_URL must use HTTPS.')
  return async (email, token, language) => {
    const url = new URL('/redefinir-senha', base)
    url.hash = new URLSearchParams({ token, lang: language }).toString()
    const pt = language === 'pt-BR'
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: POKE_BATTLE_MAIL_FROM, to: [email],
        subject: pt ? 'Draftmon · Redefinição de senha' : 'Draftmon · Password reset',
        text: pt
          ? `Use este link para redefinir sua senha. Ele expira em 30 minutos. Se você não fez o pedido, ignore esta mensagem.\n\n${url}`
          : `Use this link to reset your password. It expires in 30 minutes. If you didn't request it, ignore this message.\n\n${url}`,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error(`Mail provider returned ${response.status}.`)
  }
}

export function createAccounts(file, sendReset = resetMailer()) {
  const store = jsonStore(file, { users: {}, sessions: {} })
  const attempts = new Map()

  const sessionKey = (request) => {
    const cookie = request.headers.cookie?.split(';').map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${TOKEN}=`))?.slice(TOKEN.length + 1)
    return cookie && /^[a-f0-9]{64}$/.test(cookie) ? hash(cookie) : null
  }

  function identify(request) {
    const key = sessionKey(request)
    if (!key) return null
    const { users, sessions } = store.read()
    const session = sessions[key]
    if (!session || session.expires <= Date.now()) return null
    const account = users[session.username]
    return account ? { id: account.id, username: session.username } : null
  }

  function privateAccount(account, username) {
    return { id: account.id, username, email: account.email ?? null }
  }

  function checkEmail(users, email, username) {
    if (!emailValid(email)) fail(400, 'Enter a valid email address.')
    if (Object.entries(users).some(([name, account]) => name !== username && account.email === email)) {
      fail(409, 'That email is already linked to an account.')
    }
  }

  function cookie(request, response, token, age) {
    const secure = request.socket.encrypted || process.env.POKE_BATTLE_SECURE_COOKIES === '1'
    response.setHeader('Set-Cookie', `${TOKEN}=${token}; Path=/; Max-Age=${age}; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`)
  }

  function createSession(request, response, users, username) {
    const token = randomHex(32)
    const now = Date.now()
    const key = sessionKey(request)
    const sessions = Object.fromEntries(Object.entries(store.read().sessions)
      .filter(([id, value]) => id !== key && value.expires > now))
    sessions[hash(token)] = { username, expires: now + SESSION_AGE * 1000 }
    store.write({ users, sessions })
    cookie(request, response, token, SESSION_AGE)
    return { account: privateAccount(users[username], username) }
  }

  async function handle(request, response, path) {
    if (path === '/api/auth/session' && request.method === 'GET') {
      const account = identify(request)
      return { account: account ? privateAccount(store.read().users[account.username], account.username) : null }
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
    if (!signup && !recover && !reset && !changeEmail && path !== '/api/auth/login') fail(404, 'Action not available.')
    const { username: input, password, email: rawEmail, token, language } = await readBody(request)
    const email = emailAddress(rawEmail)
    const now = Date.now()
    for (const [address, entry] of attempts) if (entry.expires <= now) attempts.delete(address)
    const address = `${path}:${request.socket.remoteAddress ?? 'local'}`
    const limit = attempts.get(address) ?? { expires: now + 60_000, count: 0 }
    if (++limit.count > 12) fail(429, 'Too many attempts. Try again in a minute.')
    attempts.set(address, limit)

    if (recover) {
      if (!emailValid(email)) fail(400, 'Enter a valid email address.')
      const { users, sessions } = store.read()
      const found = Object.entries(users).find(([, account]) => account.email === email)
      if (sendReset && found && now - (found[1].reset?.issued ?? 0) >= 60_000) {
        const [username, account] = found
        const token = randomHex(32)
        store.write({ users: { ...users, [username]: { ...account, reset: { hash: hash(token), issued: now, expires: now + RESET_AGE } } }, sessions })
        setImmediate(() => {
          void Promise.resolve().then(() => sendReset(email, token, language === 'pt-BR' ? 'pt-BR' : 'en'))
            .catch(() => console.error('Draftmon password reset email delivery failed.'))
        })
      }
      return { account: null }
    }

    if (reset) {
      if (!passwordValid(password)) fail(400, 'Use a password with 8–128 characters.')
      const invalid = () => fail(400, 'This reset link is invalid or expired.')
      if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) invalid()
      const key = hash(token)
      const found = Object.entries(store.read().users).find(([, account]) => account.reset?.hash === key && account.reset.expires > now)
      if (!found) invalid()
      const [username] = found
      const salt = randomHex(16)
      const digest = await derive(password, salt, 64)
      const { users, sessions } = store.read()
      const account = users[username]
      if (account.reset?.hash !== key || account.reset.expires <= Date.now()) invalid()
      const updated = { ...account, salt, password: digest.toString('hex') }
      delete updated.reset
      store.write({ users: { ...users, [username]: updated }, sessions: Object.fromEntries(
        Object.entries(sessions).filter(([, session]) => session.username !== username),
      ) })
      return { account: null }
    }

    const current = changeEmail ? identify(request) : null
    if (changeEmail && !current) fail(401, 'Sign in to update your email.')
    const username = current?.username ?? (typeof input === 'string' ? input.trim().toLowerCase() : '')
    if (!/^[a-z0-9_]{3,24}$/.test(username) || !passwordValid(password)) {
      fail(400, 'Use a username with 3–24 letters, digits or underscores and a password with 8–128 characters.')
    }
    // Copy the account only after the asynchronous derivation to keep concurrent writes consistent.
    const existing = Object.hasOwn(store.read().users, username) ? store.read().users[username] : undefined
    const salt = signup || !existing ? randomHex(16) : existing.salt
    const digest = await derive(password, salt, 64)
    const { users } = store.read()
    if (signup) {
      if (Object.hasOwn(users, username)) fail(409, 'That username is taken.')
      checkEmail(users, email, username)
      const account = { id: randomHex(6).toUpperCase(), email, salt, password: digest.toString('hex') }
      return createSession(request, response, { ...users, [username]: account }, username)
    }
    if (!existing || users[username]?.password !== existing.password || !timingSafeEqual(digest, Buffer.from(existing.password, 'hex'))) {
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
