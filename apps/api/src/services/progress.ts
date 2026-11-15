import { gameData } from '@draftmon/content'
import type { PokedexBody } from '@draftmon/contracts'
import { fail } from '../http'
import type { Progress, Room, Store, TournamentEngine } from '../models'
import type { Player } from './players'

const speciesIds = new Set(
  gameData.pokemon.map(({ species, name }) => species?.name ?? name),
)

export function createProgress(
  store: Store<Record<string, Progress>>,
  rooms: Store<Record<string, Room>>,
  saveRoom: (room: Room) => void,
  engine: TournamentEngine,
) {
  return (player: Player, owner: string | undefined, battle?: PokedexBody) => {
    if (owner !== `${player.account ? 'account' : 'guest'}:${player.id}`)
      fail(403, 'Profile not available.')
    const data = store.read()
    const progress = data[player.key] ?? { counts: {}, battles: {} }
    if (battle) {
      const { id, species } = battle
      if (
        !/^[a-f0-9]{32}$/.test(id) ||
        species.some((name) => !speciesIds.has(name))
      )
        fail(400, 'Invalid battle history.')
      if (!progress.battles[id]) {
        for (const name of new Set(species))
          progress.counts[name] = (progress.counts[name] ?? 0) + 1
        progress.battles[id] = true
        store.write({ ...data, [player.key]: progress })
      }
    }
    const counts = { ...progress.counts }
    for (const stored of Object.values(rooms.read())) {
      const member = stored.members[player.key]
      if (!member || !stored.play) continue
      // Older replays lack a list of the Pokémon revealed in battle.
      const room = structuredClone(stored)
      let changed = false
      for (const { matches } of room.play?.rounds ?? []) {
        for (const match of matches) {
          if (!match.seen && match.replay) {
            const { teams, seed } = match.replay
            const result = engine.battleTeams(teams[0], teams[1], seed, [
              'Player',
              'Opponent',
            ])
            match.seen = [
              engine.battleSpecies(result, 0),
              engine.battleSpecies(result, 1),
            ]
            changed = true
          }
          const visible =
            member.id === match.left
              ? match.seen?.[0]
              : member.id === match.right
                ? match.seen?.[1]
                : undefined
          for (const name of visible ?? [])
            counts[name] = (counts[name] ?? 0) + 1
        }
      }
      if (changed) saveRoom(room)
    }
    return { counts }
  }
}
