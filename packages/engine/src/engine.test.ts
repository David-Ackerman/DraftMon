import { describe, expect, it } from 'vitest'
import { gameData } from '@draftmon/content'
import { moveEffect, moveLabel, rarityOf, speciesOf, typesOf } from './pokemon'
import { buildTypeChart, effectiveness } from './typeChart'
import {
  calcDamage,
  calcStat,
  chooseMoveset,
  createMon,
  simulateBattle,
} from './battle'
import {
  createLeague,
  OPTIONS_PER_ROLL,
  PLAYER_LEVEL,
  rollOptions,
  trainerTeamForMatch,
} from './game'
import { createRng } from './rng'
import { battleSpecies, regionalPokedex } from './pokedex'

const chart = buildTypeChart(gameData.types)
const eff = (atk: string, ...def: string[]) => effectiveness(chart, atk, def)

describe('move localization', () => {
  it('has a Brazilian Portuguese name and effect for every move in the catalog', () => {
    for (const move of gameData.moves) {
      expect(moveLabel(move.name, 'pt-BR', gameData.moveTranslations)).not.toBe(
        moveLabel(move.name),
      )
      expect(
        moveEffect(move, 'pt-BR', gameData.moveTranslations),
      ).toMatchObject({ language: 'pt-BR', text: expect.any(String) })
    }
  })

  it('records localized move names for battles and replays', () => {
    const result = simulateBattle(
      [{ name: 'pikachu', moves: ['thunderbolt'] }],
      [{ name: 'squirtle', moves: ['water-gun'] }],
      {
        data: gameData,
        chart,
        rng: createRng(10),
        levels: [50, 50],
        maxTurns: 1,
      },
    )
    const event = result.events.find(
      (entry) => entry.kind === 'move' && entry.side === 0,
    )
    expect(event).toMatchObject({
      move: 'thunderbolt',
      text: 'Pikachu used Thunderbolt',
      pt: 'Pikachu usou Raio!',
    })
  })
})

describe('Pokédex', () => {
  it('lists each species once in its first regional Pokédex', () => {
    const catalog = regionalPokedex(gameData)
    const entries = catalog.flatMap(({ pokemon }) =>
      pokemon.map(({ key }) => key),
    )
    expect(new Set(entries).size).toBe(entries.length)
    expect(entries.length).toBe(new Set(gameData.pokemon.map(speciesOf)).size)
    for (const { region, pokemon } of catalog) {
      expect(
        pokemon.every(
          ({ key }) => gameData.regionsBySpecies.get(key)?.[0] === region.name,
        ),
      ).toBe(true)
    }
  })

  it('counts only species that entered battle and combines deployed alternate forms', () => {
    const base = {
      data: gameData,
      chart,
      rng: createRng(1),
      levels: [50, 50] as [number, number],
      maxTurns: 1,
    }
    const result = simulateBattle(
      [{ name: 'decidueye' }, { name: 'decidueye-hisui' }, { name: 'pikachu' }],
      [{ name: 'bulbasaur' }],
      base,
    )
    result.events = [
      { kind: 'switch', side: 0, slot: 0, text: '' },
      { kind: 'switch', side: 1, slot: 0, text: '' },
      { kind: 'switch', side: 0, slot: 1, text: '' },
    ]
    expect(battleSpecies(result, 0)).toEqual(['decidueye'])
    expect(battleSpecies(result, 1)).toEqual(['bulbasaur'])
  })
})

describe('type chart', () => {
  it('has all 18 types', () => {
    expect(chart.size).toBe(18)
  })

  it.each([
    ['water', ['fire'], 2],
    ['fire', ['grass'], 2],
    ['grass', ['water'], 2],
    ['electric', ['ground'], 0],
    ['ground', ['flying'], 0],
    ['normal', ['ghost'], 0],
    ['ghost', ['normal'], 0],
    ['fighting', ['ghost'], 0],
    ['psychic', ['dark'], 0],
    ['dragon', ['fairy'], 0],
    ['poison', ['steel'], 0],
    ['fairy', ['dragon'], 2],
    ['steel', ['fairy'], 2],
    ['ice', ['dragon'], 2],
    ['fire', ['fire'], 0.5],
    ['bug', ['fairy'], 0.5],
    ['dark', ['ghost'], 2],
    ['rock', ['flying'], 2],
  ] as [string, string[], number][])(
    '%s vs %j = %d',
    (atk: string, def: string[], mult: number) => {
      expect(eff(atk, ...def)).toBe(mult)
    },
  )

  it('multiplies dual types', () => {
    expect(eff('electric', 'water', 'flying')).toBe(4)
    expect(eff('ice', 'dragon', 'flying')).toBe(4)
    expect(eff('fire', 'water', 'rock')).toBe(0.25)
    expect(eff('ground', 'electric', 'flying')).toBe(0)
    expect(eff('fighting', 'normal', 'ghost')).toBe(0)
  })

  it('keeps _to and _from relations consistent', () => {
    for (const t of gameData.types) {
      for (const d of t.damage_relations.double_damage_to) {
        const other = gameData.types.find((x) => x.name === d.name)!
        expect(
          (
            other as unknown as {
              damage_relations: { double_damage_from: { name: string }[] }
            }
          ).damage_relations.double_damage_from.map((x) => x.name),
        ).toContain(t.name)
      }
    }
  })
})

describe('content', () => {
  it('every creature has 1-2 known types, 6 stats, a region and valid moves', () => {
    for (const p of gameData.pokemon) {
      expect(typesOf(p).every((t) => chart.has(t))).toBe(true)
      expect(p.types.length).toBeGreaterThanOrEqual(1)
      expect(p.stats).toHaveLength(6)
      expect(
        gameData.regionsBySpecies.get(speciesOf(p))?.length,
      ).toBeGreaterThan(0)
      expect(chooseMoveset(p, gameData)).toHaveLength(4)
    }
  })

  it('every trainer has 6 known creatures', () => {
    for (const t of gameData.trainers) {
      expect(t.pokemon).toHaveLength(6)
      for (const m of t.pokemon)
        expect(gameData.pokemonByName.has(m.name)).toBe(true)
    }
  })
})

describe('battle mechanics', () => {
  it.each([
    { replacement: 'electrode', firstSide: 1 },
    { replacement: 'snorlax', firstSide: 0 },
  ])(
    'recalculates move order after a knockout and replacement with $replacement',
    ({
      replacement,
      firstSide,
    }: {
      replacement: string
      firstSide: number
    }) => {
      const result = simulateBattle(
        [{ name: 'arcanine', moves: ['flamethrower'] }],
        [
          { name: 'bulbasaur', moves: ['tackle'] },
          { name: replacement, moves: ['tackle'] },
        ],
        {
          data: gameData,
          chart,
          rng: () => 0.5,
          levels: [50, 50],
          maxTurns: 2,
        },
      )
      const secondTurn = result.events.findIndex(
        (event) => event.kind === 'turn' && event.turn === 2,
      )
      expect(secondTurn).toBeGreaterThan(0)
      const previous = result.events.slice(0, secondTurn)
      expect(
        previous
          .filter((event) => event.kind === 'move')
          .map((event) => event.side),
      ).toEqual([0])
      expect(previous.at(-1)).toMatchObject({
        kind: 'switch',
        side: 1,
        slot: 1,
      })
      expect(result.events[secondTurn + 1]).toMatchObject({
        kind: 'move',
        side: firstSide,
      })
    },
  )

  it('computes level 50 stats like the main series formula', () => {
    expect(calcStat(100, 50, 'hp')).toBe(175)
    expect(calcStat(100, 50, 'attack')).toBe(120)
  })

  it('applies STAB and type effectiveness', () => {
    const fire = createMon(gameData, { name: 'arcanine' }, 50)
    const grass = createMon(gameData, { name: 'venusaur' }, 50)
    const water = createMon(gameData, { name: 'blastoise' }, 50)
    const flameLash = gameData.moveByName.get('flamethrower')!
    const vsGrass = calcDamage(chart, fire, grass, flameLash).damage
    const vsWater = calcDamage(chart, fire, water, flameLash).damage
    expect(vsGrass).toBeGreaterThan(vsWater * 3)
  })

  it('ground creatures are immune to electric attacks', () => {
    const elec = createMon(gameData, { name: 'pikachu' }, 50)
    const ground = createMon(gameData, { name: 'golem' }, 50)
    expect(
      calcDamage(chart, elec, ground, gameData.moveByName.get('thunderbolt')!)
        .damage,
    ).toBe(0)
  })

  it('picks 4 moves from a large learnset favouring STAB', () => {
    const p = structuredClone(gameData.pokemonByName.get('arcanine')!)
    p.moves = gameData.moves.map((m) => ({ move: { name: m.name } }))
    const set = chooseMoveset(p, gameData)
    expect(set).toHaveLength(4)
    expect(
      set.some(
        (m) => m.type.name === 'fire' && m.damage_class.name !== 'status',
      ),
    ).toBe(true)
  })

  it('is deterministic for a seed and always finishes', () => {
    const a = [{ name: 'arcanine' }, { name: 'lapras' }, { name: 'gardevoir' }]
    const b = [{ name: 'steelix' }, { name: 'lanturn' }, { name: 'gengar' }]
    const run = (seed: number) =>
      simulateBattle(a, b, {
        data: gameData,
        chart,
        rng: createRng(seed),
        levels: [50, 50],
      })
    const r1 = run(42)
    const r2 = run(42)
    expect(r1.events).toEqual(r2.events)
    expect(r1.events.at(-1)?.kind).toBe('end')
    const loser = 1 - r1.winner
    expect(r1.teams[loser].every((m) => m.hp === 0)).toBe(true)
  })

  it('a strongly favoured team wins most battles', () => {
    // water team vs fire team
    const water = [
      { name: 'lapras' },
      { name: 'milotic' },
      { name: 'swampert' },
    ]
    const fire = [
      { name: 'rapidash' },
      { name: 'arcanine' },
      { name: 'magcargo' },
    ]
    let wins = 0
    for (let s = 0; s < 50; s++) {
      if (
        simulateBattle(water, fire, {
          data: gameData,
          chart,
          rng: createRng(s),
          levels: [50, 50],
        }).winner === 0
      )
        wins++
    }
    expect(wins).toBeGreaterThan(40)
  })
})

describe('draft', () => {
  it('offers 10 unique Pokémon and fills shortages with non-rare Normal types, including after rerolls', () => {
    const rng = createRng(912)
    const rareSeen = new Set<string>()
    const wildcardNames = new Set(
      gameData.pokemon
        .filter(
          (pokemon) =>
            !rarityOf(pokemon) && typesOf(pokemon).includes('normal'),
        )
        .map(({ name }) => name),
    )
    for (let i = 0; i < 40; i++) {
      const taken: string[] = []
      for (let pick = 0; pick < 6; pick++) {
        const initial = rollOptions(gameData, rng, taken)
        const rolls = [
          initial,
          ...(['type', 'region', 'both'] as const).map((mode) =>
            rollOptions(gameData, rng, taken, mode, initial),
          ),
        ]
        for (const roll of rolls) {
          expect(new Set(roll.options).size).toBe(10)
          expect(roll.options.some((name) => taken.includes(name))).toBe(false)
          const rare = roll.options
            .map((name) => rarityOf(gameData.pokemonByName.get(name)!))
            .filter((rarity) => rarity !== null)
          expect(
            roll.options
              .slice(roll.matches)
              .every((name) => wildcardNames.has(name)),
          ).toBe(true)
          expect(rare.length).toBeLessThanOrEqual(1)
          if (rare[0]) rareSeen.add(rare[0])
        }
        taken.push(initial.options[0])
      }
    }
    expect(rareSeen).toEqual(new Set(['Legendary', 'Mythical']))
  })

  it('rolls options matching region + type when possible', () => {
    const rng = createRng(7)
    for (let i = 0; i < 50; i++) {
      const roll = rollOptions(gameData, rng, [])
      expect(roll.options).toHaveLength(OPTIONS_PER_ROLL)
      expect(roll.matches).toBeGreaterThan(0)
      for (const name of roll.options.slice(0, roll.matches)) {
        const p = gameData.pokemonByName.get(name)!
        expect(typesOf(p)).toContain(roll.type)
        expect(gameData.regionsBySpecies.get(speciesOf(p))).toContain(
          roll.region,
        )
      }
    }
  })

  it('reroll type keeps region; reroll region keeps type', () => {
    const rng = createRng(3)
    const first = rollOptions(gameData, rng, [])
    const t = rollOptions(gameData, rng, [], 'type', first)
    expect(t.region).toBe(first.region)
    expect(t.type).not.toBe(first.type)
    const r = rollOptions(gameData, rng, [], 'region', first)
    expect(r.type).toBe(first.type)
    expect(r.region).not.toBe(first.region)
  })

  it('never offers already drafted creatures', () => {
    const rng = createRng(11)
    const taken: string[] = []
    for (let i = 0; i < 6; i++) {
      const roll = rollOptions(gameData, rng, taken)
      for (const o of roll.options) expect(taken).not.toContain(o)
      taken.push(roll.options[0])
    }
  })
})

describe('league', () => {
  it('has 7 distinct trainers ending with a champion', () => {
    const league = createLeague(gameData, createRng(5))
    expect(league).toHaveLength(7)
    expect(new Set(league.map((m) => m.trainer.id)).size).toBe(7)
    expect(league.slice(0, 3).every((m) => m.trainer.tier === 1)).toBe(true)
    expect(league.slice(3, 6).every((m) => m.trainer.tier === 2)).toBe(true)
    expect(league[6].trainer.tier).toBe(3)
  })

  it('trainer order changes between matches but the creatures stay the same', () => {
    const t = gameData.trainers[0]
    const rng = createRng(9)
    const orders = Array.from({ length: 10 }, () =>
      trainerTeamForMatch(t, rng)
        .map((m) => m.name)
        .join(','),
    )
    expect(new Set(orders).size).toBeGreaterThan(1)
    for (const o of orders)
      expect(o.split(',').sort()).toEqual(t.pokemon.map((p) => p.name).sort())
  })

  it('balance: random drafted teams reach the final sometimes but not always', () => {
    let totalWins = 0
    let champions = 0
    const runs = 200
    for (let s = 0; s < runs; s++) {
      const rng = createRng(1000 + s)
      const team: string[] = []
      while (team.length < 6) {
        const roll = rollOptions(gameData, rng, team)
        // a "reasonable" player: pick the highest base-stat option
        const best = [...roll.options].sort((a, b) => {
          const bst = (n: string) =>
            gameData.pokemonByName
              .get(n)!
              .stats.reduce((x, y) => x + y.base_stat, 0)
          return bst(b) - bst(a)
        })[0]
        team.push(best)
      }
      let wins = 0
      for (const match of createLeague(gameData, rng)) {
        const res = simulateBattle(
          team.map((name) => ({ name })),
          trainerTeamForMatch(match.trainer, rng),
          { data: gameData, chart, rng, levels: [PLAYER_LEVEL, match.level] },
        )
        if (res.winner !== 0) break
        wins++
      }
      totalWins += wins
      if (wins === 7) champions++
    }
    console.log(
      `balance: avg wins ${(totalWins / runs).toFixed(2)}/7, champions ${champions}/${runs}`,
    )
    expect(champions).toBeLessThan(runs * 0.6)
    expect(totalWins / runs).toBeGreaterThan(1.5)
  }, 15_000)
})

describe('run summary', () => {
  it('credits knockouts and defeats consistently with the battle', async () => {
    const { summarizeBattle } = await import('./summary')
    for (let seed = 0; seed < 20; seed++) {
      const res = simulateBattle(
        [{ name: 'arcanine' }, { name: 'lapras' }, { name: 'gardevoir' }],
        [{ name: 'steelix' }, { name: 'lanturn' }, { name: 'gengar' }],
        {
          data: gameData,
          chart,
          rng: createRng(seed),
          levels: [50, 50],
          names: ['David', 'Misty'],
        },
      )
      const s = summarizeBattle(res, 'misty', 'Group 1')
      const foeFaints = res.events.filter(
        (e) => e.kind === 'faint' && e.side === 1,
      ).length
      const kos = Object.values(s.kos).reduce((a, b) => a + b, 0)
      expect(kos).toBeLessThanOrEqual(foeFaints)
      expect(s.fainted.length + s.survivors).toBe(3)
      expect(s.won).toBe(res.winner === 0)
      expect(res.events[0].text).toBe('David chose Arcanine')
    }
  })
})
