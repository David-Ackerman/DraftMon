import type { IncomingMessage, ServerResponse } from 'node:http'
import type * as TournamentEngine from '../src/engine/tournament'

export function createLobbyHandler(file?: string, loadEngine?: () => Promise<typeof TournamentEngine>): (
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void,
) => Promise<void>
