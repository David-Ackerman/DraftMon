import { openDatabase } from '@draftmon/db'
import { expect, test } from 'vitest'
import { createApp } from './app'
import { testServer } from './test-server'

const testUrl = process.env.DATABASE_TEST_URL

test.skipIf(!testUrl)(
  'persists a tournament across production Postgres connections',
  async () => {
    const first = await openDatabase({ url: testUrl })
    const server = await testServer(
      createApp({ database: first, sendReset: null }).app,
    )
    let cookie: string
    let code: string
    try {
      const registration = await server.request('/api/auth/register', {
        username: 'postgres_trainer',
        password: 'local-test-password',
        email: 'postgres@example.test',
      })
      expect(registration.status).toBe(200)
      cookie = registration.headers.get('set-cookie')?.split(';')[0] ?? ''
      expect(cookie).toMatch(/^poke_session=/)
      const creation = await server.request(
        '/api/rooms',
        {
          nameOfRoom: 'Postgres tournament',
          kind: 'tournament',
          groups: false,
          bots: 1,
          avatar: 'red',
        },
        { Cookie: cookie },
      )
      expect(creation.status).toBe(200)
      code = ((await creation.json()) as { code: string }).code
      const tournament = await server.request(
        `/api/rooms/${code}/start`,
        {},
        { Cookie: cookie },
      )
      expect(tournament.status).toBe(200)
    } finally {
      await server.close()
      await first.close()
    }

    const reopened = await openDatabase({ url: testUrl })
    const reader = await testServer(
      createApp({ database: reopened, sendReset: null }).app,
    )
    try {
      const response = await reader.request(`/api/rooms/${code}`, undefined, {
        Cookie: cookie,
      })
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        code,
        play: {
          phase: 'draft',
          self: { roll: { options: expect.any(Array) } },
        },
      })
    } finally {
      await reader.close()
      await reopened.close()
    }
  },
  15_000,
)
