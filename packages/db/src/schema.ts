import { integer, jsonb, pgTable, primaryKey, text } from 'drizzle-orm/pg-core'

type Json = Record<string, unknown>
const data = () => jsonb('data').$type<Json>().notNull()
export const accounts = pgTable('accounts', {
  username: text().primaryKey(),
  data: data(),
})
export const sessions = pgTable('sessions', {
  hash: text().primaryKey(),
  data: data(),
})
export const lobbies = pgTable('lobbies', {
  code: text().primaryKey(),
  data: data(),
})
export const lobbyMembers = pgTable(
  'lobby_members',
  {
    code: text()
      .notNull()
      .references(() => lobbies.code, { onDelete: 'cascade' }),
    player: text().notNull(),
    position: integer().notNull(),
    data: data(),
  },
  (t) => [primaryKey({ columns: [t.code, t.player] })],
)
export const tournaments = pgTable('tournaments', {
  code: text()
    .primaryKey()
    .references(() => lobbies.code, { onDelete: 'cascade' }),
  data: data(),
})
export const tournamentMatches = pgTable(
  'tournament_matches',
  {
    code: text()
      .notNull()
      .references(() => tournaments.code, { onDelete: 'cascade' }),
    round: integer().notNull(),
    slot: integer().notNull(),
    data: data(),
  },
  (t) => [primaryKey({ columns: [t.code, t.round, t.slot] })],
)
export const pokedex = pgTable('pokedex', {
  player: text().primaryKey(),
  data: data(),
})
export const bugReports = pgTable('bug_reports', {
  issue: text().primaryKey(),
  data: data(),
})
