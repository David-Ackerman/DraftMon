import { simulateBattle } from './battle'
import type { GameData } from '@draftmon/content'
import { rollOptions, PLAYER_LEVEL } from './game'
import type { RerollMode, Roll } from './game'
import { buildTypeChart } from './typeChart'
import { createRng, seedFromString, shuffle } from './rng'
import { battleSpecies } from './pokedex'

export function shufflePokemon(seed: string, names: string[]) {
  return shuffle(createRng(seedFromString(seed)), names)
}

export function createTournamentEngine(gameData: GameData) {
  const chart = buildTypeChart(gameData.types)

  function draftRoll(
    seed: string,
    team: string[],
    attempts: number,
    mode?: RerollMode,
    previous?: Roll,
  ) {
    return rollOptions(
      gameData,
      createRng(seedFromString(`${seed}:${team.length}:${attempts}`)),
      team,
      mode,
      previous,
    )
  }

  function botProfiles(seed: string, count: number) {
    return shuffle(createRng(seedFromString(seed)), gameData.trainers)
      .slice(0, count)
      .map((trainer) => ({
        id: `bot-${trainer.id}`,
        name: trainer.name,
        avatar: trainer.sprite,
        bot: true,
        team: trainer.pokemon.map(({ name }) => name),
      }))
  }

  function battleTeams(
    left: string[],
    right: string[],
    seed: string,
    names: [string, string],
    spectators = false,
  ) {
    const result = simulateBattle(
      left.map((name) => ({ name })),
      right.map((name) => ({ name })),
      {
        data: gameData,
        chart,
        rng: createRng(seedFromString(seed)),
        levels: [PLAYER_LEVEL, PLAYER_LEVEL],
        names,
      },
    )
    if (spectators) {
      const revealed = [0, 0]
      for (const event of result.events) {
        if (event.kind === 'switch')
          revealed[event.side] = Math.max(revealed[event.side], event.slot + 1)
      }
      result.teams = [
        result.teams[0].slice(0, revealed[0]),
        result.teams[1].slice(0, revealed[1]),
      ]
    }
    return result
  }

  return { draftRoll, botProfiles, battleTeams, shufflePokemon, battleSpecies }
}
