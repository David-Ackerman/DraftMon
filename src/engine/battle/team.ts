import { baseStat, displayName, typesOf } from '../data'
import type { ApiMove, ApiPokemon, GameData, StatName } from '../data'
import type { BattleMon, TeamMember } from './types'
import { isDamaging } from './move-rules'

export function calcStat(base: number, level: number, stat: StatName): number {
  const core = Math.floor(((2 * base + 31) * level) / 100)
  return stat === 'hp' ? core + level + 10 : core + 5
}

/**
 * Picks up to 4 battle moves. Uses explicit moves when given; otherwise the
 * creature's move list (a full PokeAPI learnset works too): best STAB attack per
 * own type, then best coverage attacks, then one useful status move.
 */
export function chooseMoveset(p: ApiPokemon, data: GameData, explicit?: string[]): ApiMove[] {
  const resolve = (names: string[]) =>
    names.map((n) => data.moveByName.get(n)).filter((m): m is ApiMove => Boolean(m))
  if (explicit?.length) return resolve(explicit).slice(0, 4)
  const all = resolve(p.moves.map((m) => m.move.name))
  if (all.length <= 4) return all
  const own = typesOf(p)
  const physical = baseStat(p, 'attack') >= baseStat(p, 'special-attack')
  const score = (m: ApiMove) => {
    const styleFit = (m.damage_class.name === 'physical') === physical ? 1 : 0.75
    return (m.power ?? 0) * ((m.accuracy ?? 100) / 100) * (own.includes(m.type.name) ? 1.5 : 1) * styleFit
  }
  const attacks = all.filter(isDamaging).sort((a, b) => score(b) - score(a))
  const chosen: ApiMove[] = []
  const usedTypes = new Set<string>()
  for (const t of own) {
    const best = attacks.find((m) => m.type.name === t)
    if (best && chosen.length < 4) {
      chosen.push(best)
      usedTypes.add(t)
    }
  }
  for (const m of attacks) {
    if (chosen.length >= 3) break
    if (!usedTypes.has(m.type.name)) {
      chosen.push(m)
      usedTypes.add(m.type.name)
    }
  }
  const status = all.find((m) => !isDamaging(m) && (m.stat_changes.some((s) => s.change > 0) || m.meta?.ailment.name !== 'none'))
  if (status && chosen.length < 4) chosen.push(status)
  for (const m of attacks) if (chosen.length < 4 && !chosen.includes(m)) chosen.push(m)
  return chosen
}

export function createMon(data: GameData, member: TeamMember, level: number): BattleMon {
  const species = data.pokemonByName.get(member.name)
  if (!species) throw new Error(`Unknown pokemon: ${member.name}`)
  const stats = Object.fromEntries(
    (['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as StatName[]).map((s) => [
      s,
      calcStat(baseStat(species, s), level, s),
    ]),
  ) as Record<StatName, number>
  return {
    name: displayName(species.name),
    species,
    types: typesOf(species),
    level,
    stats,
    maxHp: stats.hp,
    hp: stats.hp,
    status: null,
    sleepTurns: 0,
    stages: { attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 },
    moves: chooseMoveset(species, data, member.moves),
  }
}
