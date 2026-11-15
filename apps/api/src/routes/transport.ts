import type { HttpBindings } from '@hono/node-server'
import type { Context } from 'hono'
import type { IncomingMessage } from 'node:http'
import { fail, readBody } from '../http'
import type { HttpReply } from '../http'

export type AppBindings = { Bindings: HttpBindings }
export type ApiContext = Context<AppBindings>

export async function validateBody<T>(
  request: IncomingMessage,
  schema: {
    safeParse(value: unknown): { success: true; data: T } | { success: false }
  },
) {
  const parsed = schema.safeParse(await readBody(request))
  if (!parsed.success) fail(400, 'Invalid request data.')
  return parsed.data
}

export function createReply(context: ApiContext) {
  const headers = new Headers()
  let status = 404
  let body: string | Uint8Array<ArrayBuffer> | undefined
  const response: HttpReply = {
    setHeader(name, value) {
      headers.set(name, String(value))
    },
    writeHead(code, values) {
      status = code
      for (const [key, value] of Object.entries(values ?? {}))
        headers.set(key, String(value))
    },
    end(value) {
      body =
        typeof value === 'string' || value === undefined
          ? value
          : Uint8Array.from(value)
    },
  }
  return {
    response,
    json(data: object) {
      const cookie = headers.get('set-cookie')
      if (cookie) context.header('Set-Cookie', cookie)
      return context.json(data)
    },
    finish: () => new Response(body, { status, headers }),
  }
}
