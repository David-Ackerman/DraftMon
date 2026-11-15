import { expect, test } from 'vitest'
import { givenBattle } from './testing/battle'

test('a knockout prevents the defeated Pokémon from attacking that turn', () => {
  const result = givenBattle()
    .withAttacker('arcanine', 'flamethrower')
    .withDefender('bulbasaur', 'tackle')
    .run()
  expect(result.events.filter(({ kind }) => kind === 'move')).toMatchObject([
    { side: 0, move: 'flamethrower' },
  ])
  expect(result).toMatchObject({ winner: 0, turns: 1 })
})
