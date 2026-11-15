import { dirname, join, resolve } from 'node:path'

export function storagePaths(rooms = process.env.POKE_BATTLE_ROOMS_FILE || '.poke-battle/rooms.json') {
  rooms = resolve(rooms)
  return {
    rooms,
    accounts: resolve(process.env.POKE_BATTLE_ACCOUNTS_FILE || join(dirname(rooms), 'accounts.json')),
    pokedex: join(dirname(rooms), 'pokedex.json'),
  }
}
