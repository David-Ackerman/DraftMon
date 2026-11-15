import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export function jsonStore(file, initial) {
  let state
  return {
    read() {
      if (state !== undefined) return state
      try {
        state = JSON.parse(readFileSync(file, 'utf8'))
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
        state = initial
      }
      return state
    },
    write(next) {
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(`${file}.tmp`, JSON.stringify(next), { mode: 0o600 })
      renameSync(`${file}.tmp`, file)
      state = next
    },
  }
}

export function fail(status, message) {
  throw Object.assign(new Error(message), { status })
}

export async function readBody(request, maxBytes = 4096) {
  const chunks = []
  let length = 0
  for await (const chunk of request) {
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
  fail(400, 'Invalid request data.')
}
