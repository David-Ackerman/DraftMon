import type { AccountState, Database, Json, Rows } from './types'

export function memoryDatabase(): Database {
  let accountState: AccountState = { users: {}, sessions: {} }
  let rooms: Rows = {}
  let pokedex: Rows = {}
  let tail: Promise<unknown> = Promise.resolve()
  const reports = new Map<string, Json>()
  return {
    transaction(run) {
      const task = tail.then(async () => {
        let accounts = accountState
        let nextRooms = rooms
        let nextPokedex = pokedex
        const value = await run({
          readAccounts: async () => structuredClone(accounts),
          writeAccounts: async (_before, next) => {
            accounts = structuredClone(next)
          },
          readRooms: async () => structuredClone(nextRooms),
          writeRooms: async (_before, next) => {
            nextRooms = structuredClone(next)
          },
          readPokedex: async () => structuredClone(nextPokedex),
          writePokedex: async (_before, next) => {
            nextPokedex = structuredClone(next)
          },
        })
        accountState = accounts
        rooms = nextRooms
        pokedex = nextPokedex
        return value
      })
      tail = task.catch(() => {})
      return task
    },
    async recordBugReport(issue, data) {
      reports.set(issue, structuredClone(data))
    },
    async close() {
      await tail
    },
  }
}
