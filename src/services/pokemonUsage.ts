import type { Guest } from './guest'
import type { Account } from './account'

type Counts = Record<string, number>
type Entry = { id: string; species: string[] }
type Progress = { counts: Counts; pending: Entry[] }
export type UsageIdentity = { owner: string; credential: string }

const syncing = new Map<string, Promise<Counts>>()
const memory = new Map<string, Progress>()

export function usageIdentity(guest: Guest, account: Account | null): UsageIdentity {
  return { owner: account ? `account:${account.id}` : `guest:${guest.id}`, credential: guest.credential }
}

function storageKey(owner: string) {
  return `draftmon-pokedex-v1:${owner}`
}

function read(owner: string): Progress {
  try {
    const saved = localStorage.getItem(storageKey(owner))
    if (saved) return JSON.parse(saved) as Progress
  } catch { /* Use the in-memory copy. */ }
  return memory.get(owner) ?? { counts: {}, pending: [] }
}

function write(owner: string, progress: Progress) {
  memory.set(owner, progress)
  try { localStorage.setItem(storageKey(owner), JSON.stringify(progress)) } catch { /* Use memory. */ }
}

export function cachedUsage(owner: string) {
  const { counts, pending } = read(owner)
  const total = { ...counts }
  for (const entry of pending) {
    for (const species of entry.species) total[species] = (total[species] ?? 0) + 1
  }
  return total
}

export function recordPokemonUsage(identity: UsageIdentity, entry: Entry) {
  if (!entry.species.length) return
  const progress = read(identity.owner)
  if (progress.pending.some(({ id }) => id === entry.id)) return
  write(identity.owner, { ...progress, pending: [...progress.pending, entry] })
  void syncPokemonUsage(identity)
}

async function sync(identity: UsageIdentity) {
  const { owner, credential } = identity
  const url = `/api/profile/pokedex?owner=${encodeURIComponent(owner)}`
  const headers = { Authorization: `Bearer ${credential}`, 'Content-Type': 'application/json' }
  try {
    let entry = read(owner).pending[0]
    while (entry) {
      const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(entry) })
      if (!response.ok) return cachedUsage(owner)
      const { counts } = await response.json() as { counts: Counts }
      const progress = read(owner)
      write(owner, { counts, pending: progress.pending.filter(({ id }) => id !== entry.id) })
      entry = read(owner).pending[0]
    }

    const response = await fetch(url, { headers })
    if (response.ok) {
      const { counts } = await response.json() as { counts: Counts }
      write(owner, { ...read(owner), counts })
    }
  } catch {
    // The local history stays usable until the server can be reached again.
  }
  return cachedUsage(owner)
}

export function syncPokemonUsage(identity: UsageIdentity) {
  const running = syncing.get(identity.owner)
  if (running) return running
  const task = sync(identity).finally(() => syncing.delete(identity.owner))
  syncing.set(identity.owner, task)
  return task
}
