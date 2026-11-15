import type { Guest } from '../../services/guest'
import type { TournamentState } from './models'

interface Member { id: string; name: string; avatar: string }
interface Match { left: string; right: string | null; winner: string | null }
export interface Room {
  revision: number
  code: string
  name: string
  kind: 'room' | 'tournament'
  host: string
  members: Member[]
  rounds: Match[][]
  champion: string | null
  selfId: string
  settings?: { groups: boolean; bots: number; roundMinutes?: number }
  play?: TournamentState
}

export async function requestRoom<T = Room>(guest: Guest, path: string, body?: object): Promise<T> {
  const response = await fetch(`/api/rooms${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${guest.credential}`, ...(body && { 'Content-Type': 'application/json' }) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const type = response.headers.get('Content-Type')
  if (!type?.includes('application/json')) throw new Error('The lobby server is unavailable.')
  const data = await response.json()
  if (!response.ok) throw new Error(data.error)
  return data
}
