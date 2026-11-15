import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createAccounts } from './accounts.mjs'
import { backup, restore } from './backup.mjs'
import { createLobbyHandler } from './lobby.mjs'

let directory
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), 'draftmon-persistence-')) })
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  rmSync(directory, { recursive: true, force: true })
})

const oldPassword = 'first-password'
const newPassword = 'second-password'
const email = 'trainer@example.com'
const accountData = { username: 'trainer', password: oldPassword, email }
const pathsAt = (root) => Object.fromEntries(['accounts', 'rooms', 'pokedex'].map((name) => [name, join(root, name + '.json')]))

function request(url, body, cookie) {
  return Object.assign(Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []), {
    url, method: body ? 'POST' : 'GET', socket: {}, headers: { cookie },
  })
}

async function auth(accounts, action, body, cookie) {
  const headers = {}
  const url = '/api/auth/' + action
  const result = await accounts.handle(request(url, body, cookie), { setHeader: (key, value) => { headers[key] = value } }, url)
  return { ...result, cookie: headers['Set-Cookie']?.split(';')[0] }
}

async function api(handler, url, body, cookie, headers = {}) {
  let status
  let data
  await handler(request(url, body, cookie), {
    setHeader(key, value) { headers[key] = value },
    writeHead(value) { status = value },
    end(value) { data = JSON.parse(value) },
  }, () => { throw new Error('Unhandled route') })
  expect(status).toBe(200)
  return data
}

describe('password recovery', () => {
  test('sends a localized reset link with the configured Resend transport', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-api-key')
    vi.stubEnv('POKE_BATTLE_MAIL_FROM', 'Draftmon <no-reply@example.com>')
    vi.stubEnv('PUBLIC_APP_URL', 'https://draftmon.example.com')
    const send = vi.fn(async () => ({ ok: true }))
    vi.stubGlobal('fetch', send)
    const accounts = createAccounts(join(directory, 'accounts.json'))
    await auth(accounts, 'register', accountData)
    await auth(accounts, 'recover', { email, language: 'pt-BR' })
    await vi.waitFor(() => expect(send).toHaveBeenCalledOnce())
    const [[endpoint, options]] = send.mock.calls
    const message = JSON.parse(options.body)
    expect(endpoint).toBe('https://api.resend.com/emails')
    expect(message).toMatchObject({ subject: 'Draftmon · Redefinição de senha', to: [email] })
    const link = new URL(message.text.split('\n\n').at(-1))
    expect(link.origin + link.pathname).toBe('https://draftmon.example.com/redefinir-senha')
    const fields = new URLSearchParams(link.hash.slice(1))
    expect(fields.get('lang')).toBe('pt-BR')
    await auth(accounts, 'reset', { token: fields.get('token'), password: newPassword })
  })

  test('sends a one-time link only for a matching email and revokes old sessions', async () => {
    const file = join(directory, 'accounts.json')
    const deliver = vi.fn()
    const accounts = createAccounts(file, deliver)
    const registered = await auth(accounts, 'register', { ...accountData, email: ' TRAINER@example.com ' })
    expect(registered.account.email).toBe(email)
    const result = await auth(accounts, 'recover', { email: 'missing@example.com' })
    expect(await auth(accounts, 'recover', { email, language: 'pt-BR' })).toEqual(result)
    await vi.waitFor(() => expect(deliver).toHaveBeenCalledTimes(1))
    const [[recipient, token, language]] = deliver.mock.calls
    expect([recipient, language]).toEqual([email, 'pt-BR'])
    expect(readFileSync(file, 'utf8')).not.toContain(token)

    const restarted = createAccounts(file, deliver)
    const body = { token, password: newPassword }
    const results = await Promise.allSettled([auth(restarted, 'reset', body), auth(restarted, 'reset', body)])
    expect(results.map(({ status }) => status).sort()).toEqual(['fulfilled', 'rejected'])
    expect((await auth(restarted, 'session', undefined, registered.cookie)).account).toBeNull()
    await expect(auth(restarted, 'login', accountData)).rejects.toMatchObject({ status: 401 })
    expect((await auth(restarted, 'login', { ...accountData, password: newPassword })).account).toEqual(registered.account)
  })

  test('links email for older accounts and rejects duplicate email and expired links', async () => {
    const file = join(directory, 'accounts.json')
    const deliver = vi.fn()
    const first = createAccounts(file, deliver)
    await auth(first, 'register', accountData)
    const legacy = JSON.parse(readFileSync(file, 'utf8'))
    delete legacy.users.trainer.email
    writeFileSync(file, JSON.stringify(legacy))

    const accounts = createAccounts(file, deliver)
    const { account, cookie } = await auth(accounts, 'login', accountData)
    expect(account.email).toBeNull()
    expect((await auth(accounts, 'email', { email, password: oldPassword }, cookie)).account.email).toBe(email)
    await expect(auth(accounts, 'register', { ...accountData, username: 'second' })).rejects.toMatchObject({ status: 409 })
    await auth(accounts, 'recover', { email })
    await vi.waitFor(() => expect(deliver).toHaveBeenCalledTimes(1))
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 31 * 60_000)
    await expect(auth(accounts, 'reset', { token: deliver.mock.calls[0][1], password: newPassword })).rejects.toMatchObject({ status: 400 })
  })
})

test('restores accounts, tournament results and Pokédex from backup into a fresh lobby', async () => {
  const source = pathsAt(directory)
  const mail = vi.fn()
  const accounts = createAccounts(source.accounts, mail)
  const { account, cookie } = await auth(accounts, 'register', accountData)
  await auth(accounts, 'recover', { email })
  await vi.waitFor(() => expect(mail).toHaveBeenCalledTimes(1))
  const code = '00BCAB12'
  const player = { id: account.id, name: 'Trainer', avatar: 'red' }
  const key = 'account:' + account.id
  writeFileSync(source.rooms, JSON.stringify({ [code]: {
    code, name: 'Test League', kind: 'tournament', hostKey: key, members: { [key]: player }, rounds: [], champion: null,
    play: {
      phase: 'complete', participants: [player], drafts: { [account.id]: { team: [] } }, orders: {},
      rounds: [{ type: 'knockout', matches: [{ left: account.id, right: 'bot-1', winner: account.id, forfeit: 'single' }] }],
      champion: account.id,
    },
  } }))
  writeFileSync(source.pokedex, JSON.stringify({ [key]: { counts: { pikachu: 2 }, battles: {} } }))
  const archive = join(directory, 'league-backup.json')
  backup(archive, source)
  expect(() => backup(archive, source)).toThrow()
  const target = pathsAt(join(directory, 'restored'))
  restore(archive, target)
  expect(() => restore(archive, target)).toThrow(/empty destination/)
  vi.stubEnv('POKE_BATTLE_ACCOUNTS_FILE', target.accounts)
  const lobby = createLobbyHandler(target.rooms)
  expect((await api(lobby, '/api/auth/session', undefined, cookie)).account).toBeNull()
  const restored = createAccounts(target.accounts, null)
  await expect(auth(restored, 'reset', { token: mail.mock.calls[0][1], password: newPassword })).rejects.toMatchObject({ status: 400 })
  const headers = {}
  const login = await api(lobby, '/api/auth/login', accountData, undefined, headers)
  const newCookie = headers['Set-Cookie'].split(';')[0]
  expect(login.account).toEqual(account)
  expect((await api(lobby, '/api/rooms/' + code, undefined, newCookie)).play).toMatchObject({
    champion: account.id, rounds: [{ matches: [{ forfeit: 'single' }] }],
  })
  expect(await api(lobby, '/api/profile/pokedex?owner=' + key, undefined, newCookie)).toEqual({ counts: { pikachu: 2 } })
})

test('detects a corrupt backup before restoring any data', () => {
  const archive = join(directory, 'backup.json')
  const target = pathsAt(join(directory, 'restored'))
  backup(archive, pathsAt(directory))
  const snapshot = JSON.parse(readFileSync(archive, 'utf8'))
  snapshot.files.rooms.content = '{"damaged":true}'
  writeFileSync(archive, JSON.stringify(snapshot))
  expect(() => restore(archive, target)).toThrow(/checksum/)
  for (const file of Object.values(target)) expect(() => readFileSync(file)).toThrow(/ENOENT/)
})
