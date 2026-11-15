export type Json = Record<string, unknown>
export type Rows = Record<string, Json>
export type AccountState = { users: Rows; sessions: Rows }
export type ResourceState = {
  accounts: AccountState
  rooms: Rows
  pokedex: Rows
}
export type Resource = keyof ResourceState

export interface AccountRepository {
  readAccounts(): Promise<AccountState>
  writeAccounts(before: AccountState, after: AccountState): Promise<void>
}
export interface LobbyRepository {
  readRooms(): Promise<Rows>
  writeRooms(before: Rows, after: Rows): Promise<void>
}
export interface PokedexRepository {
  readPokedex(): Promise<Rows>
  writePokedex(before: Rows, after: Rows): Promise<void>
}
export interface BugReportRepository {
  recordBugReport(issue: string, data: Json): Promise<void>
}
export type StateRepositories = AccountRepository &
  LobbyRepository &
  PokedexRepository
export interface Database extends BugReportRepository {
  transaction<T>(
    run: (repositories: StateRepositories) => Promise<T>,
  ): Promise<T>
  close(): Promise<void>
}
