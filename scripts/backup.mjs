import { createHash, randomUUID } from 'node:crypto'
import { existsSync, linkSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { storagePaths } from './storage-paths.mjs'

const initial = { accounts: { users: {}, sessions: {} }, rooms: {}, pokedex: {} }
const keys = Object.keys(initial)
const checksum = (value) => createHash('sha256').update(value).digest('hex')
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

function decode(key, content) {
  const data = JSON.parse(content)
  if (!record(data) || (key === 'accounts' && (!record(data.users) || !record(data.sessions) ||
      Object.values(data.users).some((account) => !record(account) || typeof account.id !== 'string' ||
        typeof account.salt !== 'string' || !/^[a-f0-9]{128}$/.test(account.password))))) {
    throw new Error(`Invalid ${key} data.`)
  }
  return data
}

export function backup(destination, paths = storagePaths()) {
  const files = Object.fromEntries(keys.map((key) => {
    let content
    try {
      content = readFileSync(paths[key], 'utf8')
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      content = JSON.stringify(initial[key])
    }
    decode(key, content)
    return [key, { content, sha256: checksum(content) }]
  }))
  const document = JSON.stringify({ format: 'draftmon-backup-v1', createdAt: new Date().toISOString(), files })
  const file = resolve(destination)
  mkdirSync(dirname(file), { recursive: true })
  const temporary = `${file}.${randomUUID()}.tmp`
  writeFileSync(temporary, document, { mode: 0o600, flag: 'wx' })
  try {
    // Publish the complete archive without replacing an existing backup.
    linkSync(temporary, file)
  } finally {
    unlinkSync(temporary)
  }
}

export function restore(source, paths = storagePaths()) {
  const snapshot = JSON.parse(readFileSync(source, 'utf8'))
  if (snapshot?.format !== 'draftmon-backup-v1') throw new Error('Unsupported backup format.')
  const staged = keys.map((key) => {
    const entry = snapshot.files?.[key]
    if (typeof entry?.content !== 'string' || checksum(entry.content) !== entry.sha256) {
      throw new Error(`Backup checksum failed for ${key}.`)
    }
    const data = decode(key, entry.content)
    if (key === 'accounts') {
      data.sessions = {}
      for (const account of Object.values(data.users)) delete account.reset
    }
    const file = resolve(paths[key])
    return { file, content: JSON.stringify(data), temporary: `${file}.${randomUUID()}.tmp` }
  })
  if (new Set(staged.map(({ file }) => file)).size !== keys.length || staged.some(({ file }) => existsSync(file))) {
    throw new Error('Restore requires distinct, empty destination paths.')
  }
  const temporaryFiles = []
  const installed = []
  try {
    for (const { file, temporary, content } of staged) {
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(temporary, content, { mode: 0o600, flag: 'wx' })
      temporaryFiles.push(temporary)
    }
    for (const { file, temporary } of staged) {
      linkSync(temporary, file)
      installed.push(file)
    }
  } catch (error) {
    for (const file of installed) unlinkSync(file)
    throw error
  } finally {
    for (const temporary of temporaryFiles) unlinkSync(temporary)
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const [action, file, ...extra] = process.argv.slice(2)
    if (!file || extra.length || !['backup', 'restore'].includes(action)) throw new Error('Usage: pnpm backup <file> or pnpm restore <file>')
    if (action === 'backup') backup(file)
    else restore(file)
    console.log(action === 'backup' ? 'Draftmon backup created.' : 'Draftmon backup restored.')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
