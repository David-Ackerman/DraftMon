import { expect, test } from 'vitest'
import { chart } from './battle/testing/battle'
import { effectiveness } from './typeChart'

test.each([
  { attack: 'electric', defense: ['water', 'flying'], multiplier: 4 },
  { attack: 'electric', defense: ['water', 'ground'], multiplier: 0 },
  { attack: 'fire', defense: ['water', 'dragon'], multiplier: 0.25 },
  { attack: 'ice', defense: ['water', 'flying'], multiplier: 1 },
])(
  '$attack against $defense has multiplier $multiplier',
  ({ attack, defense, multiplier }) => {
    expect(effectiveness(chart, attack, defense)).toBe(multiplier)
  },
)
