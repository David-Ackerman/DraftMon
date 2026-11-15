import { createHash, scryptSync } from 'node:crypto'
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openDatabase } from '@draftmon/db'
import { expect, test, vi } from 'vitest'
import { importJson } from '../scripts/import-json'
import { createApp } from './app'
import { testServer } from './test-server'

const password = 'local-test-password'
const email = 'trainer@example.test'
const login = { username: 'trainer', password }
const sessionCookie = (response: Response) => {
  const value = response.headers.get('set-cookie')?.split(';')[0]
  if (!value) throw new Error('Expected a session cookie.')
  return { Cookie: value }
}

test('resets a password once, revokes sessions and preserves localized delivery', async () => {
  const deliver =
    vi.fn<(email: string, token: string, language: string) => void>()
  let now = Date.now()
  const { request, close } = await testServer(
    createApp({ sendReset: deliver, clock: () => now }).app,
  )
  try {
    const registered = await request('/api/auth/register', {
      ...login,
      email: ' TRAINER@example.test ',
    })
    const cookie = sessionCookie(registered)
    expect(await registered.json()).toMatchObject({ account: { email } })
    const missing = await request('/api/auth/recover', {
      email: 'missing@example.test',
    })
    const requested = await request('/api/auth/recover', {
      email,
      language: 'pt-BR',
    })
    expect(await requested.json()).toEqual(await missing.json())
    expect(deliver).toHaveBeenCalledOnce()
    const [[recipient, token, language]] = deliver.mock.calls
    expect([recipient, language]).toEqual([email, 'pt-BR'])

    now += 31 * 60_000
    expect((await request('/api/auth/reset', { token, password })).status).toBe(
      400,
    )
    await request('/api/auth/recover', { email })
    const body = {
      token: deliver.mock.calls[1][1],
      password: 'replacement-password',
    }
    const resets = await Promise.all([
      request('/api/auth/reset', body),
      request('/api/auth/reset', body),
    ])
    expect(resets.map((response) => response.status).sort()).toEqual([200, 400])
    expect(
      await (await request('/api/auth/session', undefined, cookie)).json(),
    ).toEqual({ account: null })
    expect((await request('/api/auth/login', login)).status).toBe(401)
    expect(
      (await request('/api/auth/login', { ...login, password: body.password }))
        .status,
    ).toBe(200)
  } finally {
    await close()
  }
})

test('imports legacy JSON and restores its account, sessions, tournament and Pokédex from a closed PGlite backup', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'draftmon-db-'))
  const paths = {
    accounts: join(directory, 'accounts.json'),
    rooms: join(directory, 'rooms.json'),
    pokedex: join(directory, 'pokedex.json'),
  }
  const source = join(directory, 'source')
  const restored = join(directory, 'restored')
  const code = '00BCAB12'
  const player = { id: 'AA00000000BC', name: 'Trainer', avatar: 'red' }
  const memberKey = 'account:' + player.id
  const sessionToken = 'a'.repeat(64)
  const sessionHash = createHash('sha256').update(sessionToken).digest('hex')
  const salt = 'legacy-test-salt'
  try {
    await Promise.all([
      writeFile(
        paths.accounts,
        JSON.stringify({
          users: {
            trainer: {
              id: player.id,
              password: scryptSync(password, salt, 64).toString('hex'),
              salt,
            },
          },
          sessions: {
            [sessionHash]: {
              username: 'trainer',
              expires: Date.now() + 3600000,
            },
          },
        }),
      ),
      writeFile(
        paths.rooms,
        JSON.stringify({
          [code]: {
            code,
            name: 'Test League',
            kind: 'tournament',
            hostKey: memberKey,
            members: { [memberKey]: player },
            rounds: [],
            champion: null,
            play: {
              phase: 'complete',
              participants: [player],
              drafts: { [player.id]: { team: [], roll: null, rerollsLeft: 0 } },
              orders: {},
              rounds: [
                {
                  type: 'knockout',
                  matches: [
                    {
                      left: player.id,
                      right: 'bot-1',
                      winner: player.id,
                      forfeit: 'single',
                    },
                  ],
                },
              ],
              champion: player.id,
            },
          },
        }),
      ),
      writeFile(
        paths.pokedex,
        JSON.stringify({
          [memberKey]: { counts: { pikachu: 2 }, battles: {} },
        }),
      ),
    ])
    const database = await openDatabase({ directory: source })
    try {
      const backup = join(directory, 'corrupt.json')
      await writeFile(
        backup,
        JSON.stringify({ format: 'draftmon-backup-v1', files: {} }),
      )
      await expect(importJson(database, { ...paths, backup })).rejects.toThrow(
        /checksum/,
      )
      expect(await importJson(database, paths)).toEqual({
        accounts: 1,
        rooms: 1,
        profiles: 1,
      })
      await expect(importJson(database, paths)).rejects.toThrow(/empty/)
    } finally {
      await database.close()
    }
    await cp(source, restored, {
      recursive: true,
      errorOnExist: true,
      force: false,
    })
    const backup = await openDatabase({ directory: restored })
    try {
      const { request, close } = await testServer(
        createApp({ database: backup, sendReset: null }).app,
      )
      try {
        const cookie = { Cookie: 'poke_session=' + sessionToken }
        expect(
          await (await request('/api/auth/session', undefined, cookie)).json(),
        ).toMatchObject({ account: { id: player.id, email: null } })
        expect(
          await (await request('/api/rooms/' + code, undefined, cookie)).json(),
        ).toMatchObject({
          play: {
            champion: player.id,
            rounds: [{ matches: [{ forfeit: 'single' }] }],
          },
        })
        expect(
          await (
            await request(
              '/api/profile/pokedex?owner=' + memberKey,
              undefined,
              cookie,
            )
          ).json(),
        ).toEqual({ counts: { pikachu: 2 } })
        const signedIn = await request('/api/auth/login', login)
        const linked = await request(
          '/api/auth/email',
          { email, password },
          sessionCookie(signedIn),
        )
        expect(await linked.json()).toMatchObject({ account: { email } })
        expect(
          (
            await request('/api/auth/register', {
              ...login,
              username: 'second',
              email,
            })
          ).status,
        ).toBe(409)
      } finally {
        await close()
      }
    } finally {
      await backup.close()
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}, 45_000)
