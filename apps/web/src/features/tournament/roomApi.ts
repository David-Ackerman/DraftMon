import type { Guest } from '../../services/guest'
import type { TournamentSettings } from '@draftmon/contracts'
import { requestApi } from '../../services/api'
import type { TournamentState } from './models'

interface Member {
  id: string
  name: string
  avatar: string
}
interface Match {
  left: string
  right: string | null
  winner: string | null
}
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
  settings?: TournamentSettings
  play?: TournamentState
}

export async function requestRoom<T = Room>(
  guest: Guest,
  path: string,
  body?: object,
): Promise<T> {
  return requestApi<T>(`/api/rooms${path}`, {
    body,
    credential: guest.credential,
    fallback: 'The lobby server is unavailable.',
  })
}
