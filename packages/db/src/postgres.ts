import { PGlite } from '@electric-sql/pglite'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { eq, sql } from 'drizzle-orm'
import { drizzle as pglite } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { drizzle as postgresDrizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as tables from './schema'
import type { Database, Json, Rows, StateRepositories } from './types'

type Pg = ReturnType<typeof pglite>
type Executor = Pick<Pg, 'select' | 'insert' | 'delete' | 'execute'>
const changed = (a: unknown, b: unknown) =>
  JSON.stringify(a) !== JSON.stringify(b)
const updates = (before: Rows, after: Rows) =>
  Object.keys({ ...before, ...after }).filter((id) =>
    changed(before[id], after[id]),
  )

function repositories(db: Executor): StateRepositories {
  return {
    async readAccounts() {
      const users = await db.select().from(tables.accounts)
      const sessions = await db.select().from(tables.sessions)
      return {
        users: Object.fromEntries(users.map((r) => [r.username, r.data])),
        sessions: Object.fromEntries(sessions.map((r) => [r.hash, r.data])),
      }
    },
    async writeAccounts(before, after) {
      for (const username of updates(before.users, after.users)) {
        const data = after.users[username]
        if (data)
          await db
            .insert(tables.accounts)
            .values({ username, data })
            .onConflictDoUpdate({
              target: tables.accounts.username,
              set: { data },
            })
        else
          await db
            .delete(tables.accounts)
            .where(eq(tables.accounts.username, username))
      }
      for (const hash of updates(before.sessions, after.sessions)) {
        const data = after.sessions[hash]
        if (data)
          await db
            .insert(tables.sessions)
            .values({ hash, data })
            .onConflictDoUpdate({ target: tables.sessions.hash, set: { data } })
        else
          await db.delete(tables.sessions).where(eq(tables.sessions.hash, hash))
      }
    },
    async readRooms() {
      const rooms: Rows = Object.fromEntries(
        (await db.select().from(tables.lobbies)).map((r) => [
          r.code,
          { ...r.data, members: {} },
        ]),
      )
      for (const { code, player, data } of await db
        .select()
        .from(tables.lobbyMembers)
        .orderBy(tables.lobbyMembers.position)) {
        Object.defineProperty(rooms[code].members, player, {
          value: data,
          enumerable: true,
          configurable: true,
          writable: true,
        })
      }
      for (const { code, data } of await db.select().from(tables.tournaments))
        rooms[code].play = data
      const matches = await db
        .select()
        .from(tables.tournamentMatches)
        .orderBy(tables.tournamentMatches.slot)
      for (const { code, round, slot, data } of matches) {
        const play = rooms[code].play as { rounds: { matches: Json[] }[] }
        play.rounds[round].matches[slot] = data
      }
      return rooms
    },
    async writeRooms(before, after) {
      for (const code of updates(before, after)) {
        const room = after[code]
        if (!room) {
          await db.delete(tables.lobbies).where(eq(tables.lobbies.code, code))
          continue
        }
        const { members, play, ...data } = room as Json & {
          members: Rows
          play?: Json & { rounds: Array<Json & { matches: Json[] }> }
        }
        await db
          .insert(tables.lobbies)
          .values({ code, data })
          .onConflictDoUpdate({ target: tables.lobbies.code, set: { data } })
        await db
          .delete(tables.lobbyMembers)
          .where(eq(tables.lobbyMembers.code, code))
        const memberRows = Object.entries(members).map(
          ([player, data], position) => ({ code, player, position, data }),
        )
        if (memberRows.length)
          await db.insert(tables.lobbyMembers).values(memberRows)
        await db
          .delete(tables.tournaments)
          .where(eq(tables.tournaments.code, code))
        if (!play) continue
        const { rounds, ...snapshot } = play
        await db.insert(tables.tournaments).values({
          code,
          data: {
            ...snapshot,
            rounds: rounds.map((r) => ({ ...r, matches: [] })),
          },
        })
        const matches = rounds.flatMap((row, round) =>
          row.matches.map((data, slot) => ({ code, round, slot, data })),
        )
        if (matches.length)
          await db.insert(tables.tournamentMatches).values(matches)
      }
    },
    async readPokedex() {
      return Object.fromEntries(
        (await db.select().from(tables.pokedex)).map((r) => [r.player, r.data]),
      )
    },
    async writePokedex(before, after) {
      for (const player of updates(before, after)) {
        const data = after[player]
        if (data)
          await db
            .insert(tables.pokedex)
            .values({ player, data })
            .onConflictDoUpdate({
              target: tables.pokedex.player,
              set: { data },
            })
        else
          await db
            .delete(tables.pokedex)
            .where(eq(tables.pokedex.player, player))
      }
    },
  }
}

const lock = sql`select pg_advisory_xact_lock(638199502)`
const migrationsFolder = join(
  dirname(createRequire(import.meta.url).resolve('@draftmon/db/package.json')),
  'drizzle',
)

export async function openDatabase({
  url,
  directory,
}: { url?: string; directory?: string } = {}): Promise<Database> {
  if (url) {
    const driver = postgres(url, { max: 5, prepare: false })
    const db = postgresDrizzle(driver)
    try {
      await db
        .select({ username: tables.accounts.username })
        .from(tables.accounts)
        .limit(0)
    } catch (error) {
      await driver.end()
      throw error
    }
    const executor = (tx: unknown) => tx as Executor
    return {
      transaction: (run) =>
        db.transaction(async (tx) => {
          await tx.execute(lock)
          return run(repositories(executor(tx)))
        }),
      recordBugReport: async (issue, data) => {
        await db
          .insert(tables.bugReports)
          .values({ issue, data })
          .onConflictDoNothing()
      },
      close: () => driver.end(),
    }
  }
  const driver = new PGlite(directory)
  const db = pglite(driver)
  try {
    await migrate(db, { migrationsFolder })
  } catch (error) {
    await driver.close()
    throw error
  }
  return {
    transaction: (run) => db.transaction(async (tx) => run(repositories(tx))),
    recordBugReport: async (issue, data) => {
      await db
        .insert(tables.bugReports)
        .values({ issue, data })
        .onConflictDoNothing()
    },
    close: () => driver.close(),
  }
}
