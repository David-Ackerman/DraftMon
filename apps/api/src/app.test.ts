import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { createApp } from './app'
import { testServer } from './test-server'

test('serves account and lobby routes with a shared validation boundary', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'draftmon-api-'))
  const { app } = createApp({ screenshotDirectory: directory })
  const { request, close } = await testServer(app)
  try {
    const guest = `Bearer ${'a'.repeat(64)}`
    expect(await (await request('/healthz')).json()).toEqual({ ok: true })
    const invalid = await request(
      '/api/rooms',
      { kind: 'tournament', bots: '1' },
      { Authorization: guest },
    )
    expect(invalid.status).toBe(400)
    expect(await invalid.json()).toEqual({ error: 'Invalid request data.' })

    const registration = await request('/api/auth/register', {
      username: 'trainer_test',
      password: 'local-test-password',
      email: 'trainer@example.test',
    })
    expect(registration.status).toBe(200)
    const cookie = registration.headers.get('set-cookie')?.split(';')[0]
    expect(cookie).toMatch(/^poke_session=/)
    const host = await request(
      '/api/rooms',
      {
        kind: 'tournament',
        nameOfRoom: 'Integration',
        avatar: 'red',
        groups: false,
        bots: 0,
      },
      { Cookie: cookie! },
    )
    expect(host.status).toBe(200)
    const { code } = (await host.json()) as { code: string }
    const start = await request(
      `/api/rooms/${code}/start`,
      {},
      { Cookie: cookie! },
    )
    expect(start.status).toBe(200)
    expect(await start.json()).toMatchObject({
      play: {
        phase: 'draft',
        participants: [{ ready: false }, { bot: true, ready: true }],
        self: { team: [], roll: { options: expect.any(Array) } },
      },
    })
  } finally {
    await close()
    await rm(directory, { recursive: true, force: true })
  }
})

test('the host can start with any turnout and bots fill only the missing places', async () => {
  const { request, close } = await testServer(createApp().app)
  try {
    const registration = await request('/api/auth/register', {
      username: 'tournament_host',
      password: 'local-test-password',
      email: 'host@example.test',
    })
    const session = registration.headers.get('set-cookie')?.split(';')[0]
    expect(session).toMatch(/^poke_session=/)
    const host = { Cookie: session! }

    for (const [minimumPlayers, guests, bots] of [
      [16, 0, 15],
      [4, 1, 2],
      [2, 2, 0],
    ]) {
      const created = await request(
        '/api/rooms',
        {
          kind: 'tournament',
          nameOfRoom: 'Auto-fill tournament',
          avatar: 'red',
          groups: false,
          minimumPlayers,
        },
        host,
      )
      expect(created.status).toBe(200)
      const { code } = (await created.json()) as { code: string }
      const path = `/api/rooms/${code}`

      for (let index = 0; index < guests; index++) {
        const guest = {
          Authorization: `Bearer ${(index + 1).toString(16).repeat(64)}`,
        }
        const joined = await request(`${path}/join`, { avatar: 'leaf' }, guest)
        expect(joined.status).toBe(200)
        expect((await request(`${path}/start`, {}, guest)).status).toBe(403)
      }

      const started = await request(`${path}/start`, {}, host)
      expect(started.status).toBe(200)
      const { play } = (await started.json()) as {
        play: {
          phase: string
          participants: { id: string; bot?: boolean; ready: boolean }[]
        }
      }
      expect(play.phase).toBe('draft')
      expect(play.participants).toHaveLength(1 + guests + bots)
      expect(new Set(play.participants.map(({ id }) => id)).size).toBe(
        play.participants.length,
      )
      expect(play.participants.filter(({ bot }) => bot)).toHaveLength(bots)
      expect(
        play.participants.every(({ bot, ready }) => Boolean(bot) === ready),
      ).toBe(true)
    }
  } finally {
    await close()
  }
})
