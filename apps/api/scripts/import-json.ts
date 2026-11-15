import { createHash } from 'node:crypto'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { openDatabase } from '@draftmon/db'
import type { AccountState, Database, Json, Rows } from '@draftmon/db'

const workspace = fileURLToPath(new URL('../../../', import.meta.url))
const resources = ['accounts', 'rooms', 'pokedex'] as const
const emptyAccounts: AccountState = { users: {}, sessions: {} }
const isRecord = (value: unknown): value is Json =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const isRows = (value: unknown): value is Rows =>
  isRecord(value) && Object.values(value).every(isRecord)

async function readOptional(file: string) {
  try {
    return await readFile(file, 'utf8')
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return undefined
    throw error
  }
}

function decode(
  resource: (typeof resources)[number],
  content?: string,
): unknown {
  return content === undefined
    ? resource === 'accounts'
      ? emptyAccounts
      : {}
    : JSON.parse(content)
}

async function readArchive(backup: string) {
  const archive: unknown = JSON.parse(await readFile(backup, 'utf8'))
  if (
    !isRecord(archive) ||
    archive.format !== 'draftmon-backup-v1' ||
    !isRecord(archive.files)
  ) {
    throw new Error('Unsupported legacy backup format.')
  }
  const entries = archive.files
  return resources.map((resource) => {
    const entry = entries[resource]
    if (
      !isRecord(entry) ||
      typeof entry.content !== 'string' ||
      createHash('sha256').update(entry.content).digest('hex') !== entry.sha256
    ) {
      throw new Error(`Backup checksum failed for ${resource}.`)
    }
    return decode(resource, entry.content)
  })
}

export async function importJson(
  database: Database,
  {
    accounts,
    rooms,
    pokedex,
    backup,
  }: {
    accounts: string
    rooms: string
    pokedex: string
    backup?: string
  },
) {
  const paths = { accounts, rooms, pokedex }
  const [accountData, roomData, progress] = backup
    ? await readArchive(backup)
    : await Promise.all(
        resources.map(async (resource) =>
          decode(resource, await readOptional(paths[resource])),
        ),
      )
  if (
    !isRecord(accountData) ||
    !isRows(accountData.users) ||
    !isRows(accountData.sessions) ||
    Object.values(accountData.users).some(
      (account) =>
        typeof account.id !== 'string' ||
        typeof account.password !== 'string' ||
        !(
          account.password.startsWith('$2') ||
          (typeof account.salt === 'string' &&
            /^[a-f0-9]{128}$/.test(account.password))
        ),
    ) ||
    Object.entries(accountData.sessions).some(
      ([key, session]) =>
        !/^[a-f0-9]{64}$/.test(key) ||
        typeof session.username !== 'string' ||
        !Object.hasOwn(accountData.users as Rows, session.username) ||
        typeof session.expires !== 'number',
    )
  ) {
    throw new Error('Invalid legacy account data.')
  }
  if (
    !isRows(roomData) ||
    Object.entries(roomData).some(
      ([code, room]) =>
        room.code !== code ||
        !isRows(room.members) ||
        typeof room.hostKey !== 'string' ||
        !Object.hasOwn(room.members, room.hostKey) ||
        !Array.isArray(room.rounds) ||
        (room.play !== undefined &&
          (!isRecord(room.play) ||
            !Array.isArray(room.play.rounds) ||
            room.play.rounds.some(
              (round) =>
                !isRecord(round) ||
                !Array.isArray(round.matches) ||
                !round.matches.every(isRecord),
            ))),
    )
  ) {
    throw new Error('Invalid legacy room data.')
  }
  if (
    !isRows(progress) ||
    Object.values(progress).some(
      (row) => !isRecord(row.counts) || !isRecord(row.battles),
    )
  ) {
    throw new Error('Invalid legacy Pokédex data.')
  }
  const users = accountData.users
  const sessions = backup ? {} : accountData.sessions
  if (backup) for (const account of Object.values(users)) delete account.reset
  return database.transaction(async (repo) => {
    const previous = await repo.readAccounts()
    if (
      [
        previous.users,
        previous.sessions,
        await repo.readRooms(),
        await repo.readPokedex(),
      ].some((data) => Object.keys(data).length)
    ) {
      throw new Error('Import requires an empty Draftmon database.')
    }
    await repo.writeAccounts(emptyAccounts, { users, sessions })
    await repo.writeRooms({}, roomData)
    await repo.writePokedex({}, progress)
    return {
      accounts: Object.keys(users).length,
      rooms: Object.keys(roomData).length,
      profiles: Object.keys(progress).length,
    }
  })
}

async function main() {
  const [archive, ...extra] = process.argv.slice(2)
  if (extra.length)
    throw new Error(
      'Usage: pnpm --filter @draftmon/api import-json [legacy-backup.json]',
    )
  const rooms = resolve(
    workspace,
    process.env.POKE_BATTLE_ROOMS_FILE || '.poke-battle/rooms.json',
  )
  const accounts = resolve(
    workspace,
    process.env.POKE_BATTLE_ACCOUNTS_FILE ||
      join(dirname(rooms), 'accounts.json'),
  )
  const directory =
    process.env.POKE_BATTLE_DB_DIRECTORY ||
    join(workspace, '.poke-battle', 'postgres')
  if (!process.env.DATABASE_URL)
    await mkdir(dirname(directory), { recursive: true })
  const database = await openDatabase({
    url: process.env.DATABASE_URL,
    directory,
  })
  try {
    const imported = await importJson(database, {
      accounts,
      rooms,
      pokedex: join(dirname(rooms), 'pokedex.json'),
      backup: archive && resolve(archive),
    })
    console.log('Draftmon legacy data imported.', imported)
  } finally {
    await database.close()
  }
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  await main().catch((error) => {
    console.error(
      error instanceof Error ? error.message : 'Draftmon import failed.',
    )
    process.exitCode = 1
  })
}
