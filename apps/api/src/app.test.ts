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
        bots: 1,
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
        self: { team: [], roll: { options: expect.any(Array) } },
      },
    })
  } finally {
    await close()
    await rm(directory, { recursive: true, force: true })
  }
})
