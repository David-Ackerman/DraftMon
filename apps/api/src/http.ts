import type { IncomingMessage } from 'node:http'

export type HttpReply = {
  setHeader(name: string, value: string | number): void
  writeHead(status: number, headers?: Record<string, string | number>): void
  end(body?: string | Buffer): void
}
export type ReadBody = (
  request: IncomingMessage,
  maxBytes?: number,
) => Promise<Record<string, unknown>>
export class HttpError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function fail(status: number, message: string): never {
  throw new HttpError(status, message)
}

export const readBody: ReadBody = async (request, maxBytes = 4096) => {
  const chunks: Buffer[] = []
  let length = 0
  for await (const value of request) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value)
    length += chunk.length
    if (length > maxBytes) fail(413, 'Request is too large.')
    chunks.push(chunk)
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString())
    if (body && typeof body === 'object' && !Array.isArray(body)) return body
  } catch {
    // Return the same error for invalid JSON and invalid data.
  }
  return fail(400, 'Invalid request data.')
}
