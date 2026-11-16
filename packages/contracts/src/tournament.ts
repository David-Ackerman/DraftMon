export const ROOM_PLAYER_LIMIT = 16
export const MIN_TOURNAMENT_PLAYERS = 2
export const DEFAULT_TOURNAMENT_PLAYERS = 4

export interface TournamentSettings {
  groups: boolean
  minimumPlayers?: number
  bots?: number
  roundMinutes?: number
}

export function tournamentHumanLimit(settings?: TournamentSettings) {
  const reservedBots =
    settings?.minimumPlayers === undefined ? (settings?.bots ?? 0) : 0
  return ROOM_PLAYER_LIMIT - reservedBots
}

export function tournamentBotCount(
  humans: number,
  settings?: TournamentSettings,
) {
  const target = settings?.minimumPlayers ?? humans + (settings?.bots ?? 0)
  const size = Math.min(
    ROOM_PLAYER_LIMIT,
    Math.max(MIN_TOURNAMENT_PLAYERS, target),
  )
  return Math.max(0, size - humans)
}
