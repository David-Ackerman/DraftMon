import { AsyncLocalStorage } from 'node:async_hooks'
import type { AccountState, Database, Resource, Rows } from '@draftmon/db'
import type { AccountStore, Progress, Room, Store } from './models'

type ResourceState = {
  accounts: AccountStore
  rooms: Record<string, Room>
  pokedex: Record<string, Progress>
}
type Transaction = {
  current: Partial<ResourceState>
  dirty: Set<Resource>
  committed: (() => void)[]
}

export function createState(database: Database) {
  const active = new AsyncLocalStorage<Transaction>()
  function scope() {
    const state = active.getStore()
    if (!state)
      throw new Error('Database state requires an active transaction.')
    return state
  }

  function openStore<K extends Resource>(resource: K): Store<ResourceState[K]> {
    return {
      read() {
        const value = scope().current[resource]
        if (!value)
          throw new Error('Resource missing from transaction: ' + resource)
        return value
      },
      write(value) {
        const state = scope()
        if (!state.current[resource])
          throw new Error('Resource missing from transaction: ' + resource)
        state.current[resource] = value
        state.dirty.add(resource)
      },
    }
  }

  async function transaction<T>(
    resources: readonly Resource[],
    task: () => T | Promise<T>,
  ) {
    const committed: Transaction['committed'] = []
    const result = await database.transaction(async (repo) => {
      const before: Partial<ResourceState> = {}
      if (resources.includes('accounts'))
        before.accounts = (await repo.readAccounts()) as AccountStore
      if (resources.includes('rooms'))
        before.rooms = (await repo.readRooms()) as Record<string, Room>
      if (resources.includes('pokedex'))
        before.pokedex = (await repo.readPokedex()) as Record<string, Progress>
      const state = {
        current: structuredClone(before),
        dirty: new Set<Resource>(),
        committed,
      }
      const value = await active.run(state, task)
      if (state.dirty.has('accounts'))
        await repo.writeAccounts(
          before.accounts as AccountState,
          state.current.accounts as AccountState,
        )
      if (state.dirty.has('rooms'))
        await repo.writeRooms(before.rooms as Rows, state.current.rooms as Rows)
      if (state.dirty.has('pokedex'))
        await repo.writePokedex(
          before.pokedex as Rows,
          state.current.pokedex as Rows,
        )
      return value
    })
    for (const callback of committed) callback()
    return result
  }
  return {
    openStore,
    transaction,
    afterCommit: (callback: () => void) => scope().committed.push(callback),
  }
}

export type State = ReturnType<typeof createState>
