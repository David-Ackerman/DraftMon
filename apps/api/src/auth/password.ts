import { createHash, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { compare, hash } from 'bcryptjs'

const derive = promisify(scrypt)
const bcryptRounds = 11
const dummyHash = '$2b$11$NHIB1XyS6WuIKXs3k2z4cOGflXGLDCcsWSrJj015EGH54M/F2UIrq'
const prehash = (password: string) =>
  createHash('sha256').update(password).digest('base64')

export function hashPassword(password: string) {
  return hash(prehash(password), bcryptRounds)
}

export async function verifyPassword(
  password: string,
  credential?: { password: string; salt?: string },
) {
  if (!credential) {
    await compare(prehash(password), dummyHash)
    return false
  }
  if (credential.password.startsWith('$2'))
    return compare(prehash(password), credential.password)
  if (!credential.salt || !/^[a-f0-9]{128}$/.test(credential.password))
    return false
  const digest = (await derive(password, credential.salt, 64)) as Buffer
  return timingSafeEqual(digest, Buffer.from(credential.password, 'hex'))
}
