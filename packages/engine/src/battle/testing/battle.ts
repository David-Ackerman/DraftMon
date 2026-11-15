import { gameData } from '@draftmon/content'
import { buildTypeChart } from '../../typeChart'
import { createMon } from '../team'
import { simulateBattle } from '../simulate'
import type { BattleContext, TeamMember } from '../types'

export const chart = buildTypeChart(gameData.types)

export function givenBattle() {
  let attacker: TeamMember = { name: 'pikachu' }
  let defender: TeamMember = { name: 'squirtle' }
  const builder = {
    withAttacker(name: string, ...moves: string[]) {
      attacker = { name, moves }
      return builder
    },
    withDefender(name: string, ...moves: string[]) {
      defender = { name, moves }
      return builder
    },
    context(rng = () => 0.5): BattleContext {
      const teams = [
        createMon(gameData, attacker, 50),
        createMon(gameData, defender, 50),
      ]
      return {
        chart,
        rng,
        active: [0, 0],
        current: (side) => teams[side],
        moveTranslations: gameData.moveTranslations,
      }
    },
    run(rng = () => 0.5, maxTurns = 1) {
      return simulateBattle([attacker], [defender], {
        data: gameData,
        chart,
        rng,
        levels: [50, 50],
        maxTurns,
      })
    },
  }
  return builder
}
