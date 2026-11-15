import { serve } from '@hono/node-server'
import type { createApp } from './app'

export async function testServer(app: ReturnType<typeof createApp>['app']) {
  const server = serve({ fetch: app.fetch, port: 0, hostname: '127.0.0.1' })
  await new Promise<void>((resolve, reject) => {
    if (server.listening) resolve()
    else server.once('listening', resolve).once('error', reject)
  })
  const address = server.address()
  if (!address || typeof address === 'string')
    throw new Error('Expected a TCP address')
  const origin = `http://127.0.0.1:${address.port}`
  return {
    request: (
      path: string,
      body?: object,
      headers: Record<string, string> = {},
    ) =>
      fetch(origin + path, {
        headers: { 'Content-Type': 'application/json', ...headers },
        method: body ? 'POST' : 'GET',
        body: body && JSON.stringify(body),
      }),
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}
