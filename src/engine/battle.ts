/**
 * Automated 6v6 battle simulator.
 *
 * Implemented ("medium" depth + status):
 *  - level-based stats, physical/special split, STAB 1.5x, full type chart with dual types
 *  - accuracy, priority, critical hits (crit_rate stages), random damage roll
 *  - stat stages (+/-6), drain, healing
 *  - major statuses: burn, poison, paralysis, sleep, freeze
 *  - fainted creatures are replaced by the next one in team order
 * Not yet: abilities, held items, voluntary switching, multi-turn moves.
 */
import type { ApiMove, ApiPokemon, GameData, StatName } from './data'
import { baseStat, displayName, typesOf } from './data'
import type { Rng } from './rng'
import { randInt } from './rng'
import type { TypeChart } from './typeChart'
import { effectiveness, effectivenessLabel } from './typeChart'

export type Ailment = 'burn' | 'poison' | 'paralysis' | 'sleep' | 'freeze'
export const AILMENTS: Ailment[] = ['burn', 'poison', 'paralysis', 'sleep', 'freeze']
type BoostStat = Exclude<StatName, 'hp'>
const BOOST_STATS: BoostStat[] = ['attack', 'defense', 'special-attack', 'special-defense', 'speed']

export interface TeamMember {
  name: string
  moves?: string[]
}

export interface BattleMon {
  name: string
  species: ApiPokemon
  types: string[]
  level: number
  stats: Record<StatName, number>
  maxHp: number
  hp: number
  status: Ailment | null
  sleepTurns: number
  stages: Record<BoostStat, number>
  moves: ApiMove[]
}

export type Side = 0 | 1

export type BattleEvent =
  | { kind: 'turn'; turn: number; text: string }
  | { kind: 'switch'; side: Side; slot: number; text: string }
  | { kind: 'move'; side: Side; slot: number; move: string; moveType: string; text: string }
  | { kind: 'damage'; side: Side; slot: number; hp: number; amount: number; mult: number; crit: boolean; text: string }
  | { kind: 'heal'; side: Side; slot: number; hp: number; text: string }
  | { kind: 'status'; side: Side; slot: number; status: Ailment | null; text: string }
  | { kind: 'stat'; side: Side; slot: number; stat: string; change: number; text: string }
  | { kind: 'faint'; side: Side; slot: number; text: string }
  | { kind: 'info'; text: string }
  | { kind: 'end'; winner: Side; text: string }

export interface BattleResult {
  winner: Side
  turns: number
  events: BattleEvent[]
  teams: [BattleMon[], BattleMon[]]
}

// ------------------------------------------------------------------ setup

export function calcStat(base: number, level: number, stat: StatName): number {
  const core = Math.floor(((2 * base + 31) * level) / 100)
  return stat === 'hp' ? core + level + 10 : core + 5
}

const isDamaging = (m: ApiMove) => m.damage_class.name !== 'status' && (m.power ?? 0) > 0

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

// ------------------------------------------------------------------ mechanics

const stageMult = (s: number) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s))

export function effectiveStat(mon: BattleMon, stat: BoostStat, ignore?: 'positive' | 'negative'): number {
  let stage = mon.stages[stat]
  if (ignore === 'positive' && stage > 0) stage = 0
  if (ignore === 'negative' && stage < 0) stage = 0
  let v = mon.stats[stat] * stageMult(stage)
  if (stat === 'speed' && mon.status === 'paralysis') v *= 0.5
  return v
}

const CRIT_CHANCE = [1 / 24, 1 / 8, 1 / 2, 1]

export interface DamageOptions {
  crit?: boolean
  roll?: number // 0.85..1
}

export function calcDamage(chart: TypeChart, user: BattleMon, target: BattleMon, move: ApiMove, opts: DamageOptions = {}) {
  const physical = move.damage_class.name === 'physical'
  const crit = opts.crit ?? false
  const atk = effectiveStat(user, physical ? 'attack' : 'special-attack', crit ? 'negative' : undefined)
  const def = effectiveStat(target, physical ? 'defense' : 'special-defense', crit ? 'positive' : undefined)
  const mult = effectiveness(chart, move.type.name, target.types)
  if (mult === 0) return { damage: 0, mult }
  let dmg = Math.floor(Math.floor((Math.floor((2 * user.level) / 5 + 2) * (move.power ?? 0) * atk) / def) / 50) + 2
  if (crit) dmg *= 1.5
  dmg *= opts.roll ?? 1
  if (user.types.includes(move.type.name)) dmg *= 1.5
  dmg *= mult
  if (physical && user.status === 'burn') dmg *= 0.5
  return { damage: Math.max(1, Math.floor(dmg)), mult }
}

export function canAfflict(target: BattleMon, ailment: Ailment): boolean {
  if (target.status || target.hp <= 0) return false
  const t = target.types
  if (ailment === 'burn') return !t.includes('fire')
  if (ailment === 'paralysis') return !t.includes('electric')
  if (ailment === 'poison') return !t.includes('poison') && !t.includes('steel')
  if (ailment === 'freeze') return !t.includes('ice')
  return true
}

const asAilment = (name: string | undefined): Ailment | null =>
  (AILMENTS as string[]).includes(name ?? '') ? (name as Ailment) : null

/** Stat changes from a move: who receives them (PokeAPI semantics). */
function statTarget(move: ApiMove): 'user' | 'target' {
  if (move.damage_class.name === 'status') return move.target.name === 'user' ? 'user' : 'target'
  return move.meta?.category.name === 'damage+raise' ? 'user' : 'target'
}

// ------------------------------------------------------------------ AI

/** Picks the move with the best expected value against the current target. */
export function chooseMove(chart: TypeChart, user: BattleMon, target: BattleMon, rng: Rng): ApiMove {
  const userFaster = effectiveStat(user, 'speed') >= effectiveStat(target, 'speed')
  const usesPhysical = user.moves.filter(isDamaging).filter((m) => m.damage_class.name === 'physical').length
  const usesSpecial = user.moves.filter(isDamaging).length - usesPhysical
  let best = user.moves[0]
  let bestScore = -Infinity
  for (const move of user.moves) {
    const acc = (move.accuracy ?? 100) / 100
    let score = 0
    if (isDamaging(move)) {
      const { damage, mult } = calcDamage(chart, user, target, move, { roll: 0.925 })
      if (mult === 0) score = 0
      else if (damage >= target.hp) score = 1000 + acc * 100 + move.priority * 60
      else {
        score = damage * acc
        // priority moves are worth more when we are slower
        if (move.priority > 0 && !userFaster) score *= 1.2
        // drain rewards
        if (move.meta?.drain) score *= 1 + move.meta.drain / 200
        // recoil-free self-debuffing nukes are slightly worse
        if (statTarget(move) === 'user' && move.stat_changes.some((s) => s.change < 0)) score *= 0.85
      }
    } else {
      const ailment = asAilment(move.meta?.ailment.name)
      if (ailment) {
        if (canAfflict(target, ailment) && effectiveness(chart, move.type.name, target.types) > 0) {
          const weight = {
            sleep: 0.45,
            freeze: 0.45,
            paralysis: userFaster ? 0.2 : 0.35,
            burn: effectiveStat(target, 'attack') > effectiveStat(target, 'special-attack') ? 0.4 : 0.2,
            poison: 0.25,
          }[ailment]
          score = target.maxHp * weight * acc * (target.hp / target.maxHp)
        }
      } else if (move.meta?.healing) {
        const missing = user.maxHp - user.hp
        if (user.hp / user.maxHp < 0.5) score = Math.min(missing, (user.maxHp * move.meta.healing) / 100) * 1.1
      } else if (move.stat_changes.length) {
        const onUser = statTarget(move) === 'user'
        const healthy = user.hp / user.maxHp > 0.6
        for (const sc of move.stat_changes) {
          const stat = sc.stat.name as BoostStat
          if (onUser && sc.change > 0 && healthy && user.stages[stat] < 2) {
            const relevant =
              stat === 'speed' ? !userFaster
                : stat === 'attack' ? usesPhysical > 0
                : stat === 'special-attack' ? usesSpecial > 0
                : true
            if (relevant) score += target.maxHp * 0.18 * sc.change
          } else if (!onUser && sc.change < 0 && target.stages[stat] > -2) {
            score += target.maxHp * 0.1 * -sc.change
          }
        }
      }
    }
    score *= 0.9 + rng() * 0.2
    if (score > bestScore) {
      bestScore = score
      best = move
    }
  }
  return best
}

// ------------------------------------------------------------------ simulation

export interface SimOptions {
  data: GameData
  chart: TypeChart
  rng: Rng
  levels: [number, number]
  names?: [string, string]
  maxTurns?: number
}

export function simulateBattle(teamA: TeamMember[], teamB: TeamMember[], opts: SimOptions): BattleResult {
  const { data, chart, rng } = opts
  const names = opts.names ?? ['You', 'Opponent']
  const teams: [BattleMon[], BattleMon[]] = [
    teamA.map((m) => createMon(data, m, opts.levels[0])),
    teamB.map((m) => createMon(data, m, opts.levels[1])),
  ]
  const active: [number, number] = [0, 0]
  const events: BattleEvent[] = []
  const label = (side: Side) => (side === 0 ? '' : 'Foe ')
  const monName = (side: Side) => `${label(side)}${teams[side][active[side]].name}`
  const cur = (side: Side) => teams[side][active[side]]
  const emit = (e: BattleEvent) => events.push(e)

  for (const side of [0, 1] as Side[]) {
    emit({ kind: 'switch', side, slot: 0, text: `${names[side]} sent out ${teams[side][0].name}!` })
  }

  const applyStatus = (side: Side, ailment: Ailment) => {
    const mon = cur(side)
    mon.status = ailment
    if (ailment === 'sleep') mon.sleepTurns = randInt(rng, 1, 3)
    const verb = { burn: 'was burned', poison: 'was poisoned', paralysis: 'is paralyzed', sleep: 'fell asleep', freeze: 'was frozen solid' }[ailment]
    emit({ kind: 'status', side, slot: active[side], status: ailment, text: `${monName(side)} ${verb}!` })
  }

  const applyStages = (side: Side, changes: { change: number; stat: { name: string } }[]) => {
    const mon = cur(side)
    for (const sc of changes) {
      const stat = sc.stat.name as BoostStat
      if (!BOOST_STATS.includes(stat)) continue
      const before = mon.stages[stat]
      mon.stages[stat] = Math.max(-6, Math.min(6, before + sc.change))
      const diff = mon.stages[stat] - before
      const statLabel = displayName(stat)
      if (diff === 0) {
        emit({ kind: 'info', text: `${monName(side)}'s ${statLabel} won't go any ${sc.change > 0 ? 'higher' : 'lower'}!` })
      } else {
        const how = Math.abs(diff) >= 2 ? (diff > 0 ? 'rose sharply' : 'harshly fell') : diff > 0 ? 'rose' : 'fell'
        emit({ kind: 'stat', side, slot: active[side], stat, change: diff, text: `${monName(side)}'s ${statLabel} ${how}!` })
      }
    }
  }

  const faintCheck = (side: Side) => {
    const mon = cur(side)
    if (mon.hp <= 0 && !events.some((e) => e.kind === 'faint' && e.side === side && e.slot === active[side])) {
      emit({ kind: 'faint', side, slot: active[side], text: `${monName(side)} fainted!` })
    }
  }

  /** Returns false if the user could not act. */
  const beforeMove = (side: Side): boolean => {
    const mon = cur(side)
    if (mon.status === 'sleep') {
      mon.sleepTurns--
      if (mon.sleepTurns > 0) {
        emit({ kind: 'info', text: `${monName(side)} is fast asleep.` })
        return false
      }
      mon.status = null
      emit({ kind: 'status', side, slot: active[side], status: null, text: `${monName(side)} woke up!` })
    }
    if (mon.status === 'freeze') {
      if (rng() < 0.2) {
        mon.status = null
        emit({ kind: 'status', side, slot: active[side], status: null, text: `${monName(side)} thawed out!` })
      } else {
        emit({ kind: 'info', text: `${monName(side)} is frozen solid!` })
        return false
      }
    }
    if (mon.status === 'paralysis' && rng() < 0.25) {
      emit({ kind: 'info', text: `${monName(side)} is paralyzed! It can't move!` })
      return false
    }
    return true
  }

  const performMove = (side: Side, move: ApiMove) => {
    const foe = (1 - side) as Side
    const user = cur(side)
    const target = cur(foe)
    emit({ kind: 'move', side, slot: active[side], move: move.name, moveType: move.type.name, text: `${monName(side)} used ${displayName(move.name)}!` })

    if (move.accuracy !== null && rng() * 100 >= move.accuracy) {
      emit({ kind: 'info', text: `${monName(side)}'s attack missed!` })
      return
    }
    const ailment = asAilment(move.meta?.ailment.name)

    if (!isDamaging(move)) {
      if (move.meta?.healing) {
        if (user.hp >= user.maxHp) {
          emit({ kind: 'info', text: `${monName(side)}'s HP is full!` })
        } else {
          const amount = Math.min(user.maxHp - user.hp, Math.floor((user.maxHp * move.meta.healing) / 100))
          user.hp += amount
          emit({ kind: 'heal', side, slot: active[side], hp: user.hp, text: `${monName(side)} regained health!` })
        }
      }
      if (ailment) {
        if (effectiveness(chart, move.type.name, target.types) === 0) {
          emit({ kind: 'info', text: `It doesn't affect ${monName(foe)}…` })
        } else if (!canAfflict(target, ailment)) emit({ kind: 'info', text: 'But it failed!' })
        else applyStatus(foe, ailment)
      }
      if (move.stat_changes.length) applyStages(statTarget(move) === 'user' ? side : foe, move.stat_changes)
      return
    }

    const critStage = Math.min(3, move.meta?.crit_rate ?? 0)
    const crit = rng() < CRIT_CHANCE[critStage]
    const { damage, mult } = calcDamage(chart, user, target, move, { crit, roll: 0.85 + rng() * 0.15 })
    if (mult === 0) {
      emit({ kind: 'info', text: `It doesn't affect ${monName(foe)}…` })
      return
    }
    const dealt = Math.min(target.hp, damage)
    target.hp -= dealt
    const notes = [crit ? 'A critical hit!' : '', effectivenessLabel(mult) ?? ''].filter(Boolean).join(' ')
    emit({
      kind: 'damage',
      side: foe,
      slot: active[foe],
      hp: target.hp,
      amount: dealt,
      mult,
      crit,
      text: notes || `${monName(foe)} took ${dealt} damage.`,
    })

    if (move.meta?.drain && dealt > 0) {
      const amount = Math.min(user.maxHp - user.hp, Math.max(1, Math.floor((dealt * move.meta.drain) / 100)))
      if (amount > 0) {
        user.hp += amount
        emit({ kind: 'heal', side, slot: active[side], hp: user.hp, text: `${monName(foe)} had its energy drained!` })
      }
    }
    if (target.hp > 0 && ailment && move.meta && rng() * 100 < move.meta.ailment_chance && canAfflict(target, ailment)) {
      applyStatus(foe, ailment)
    }
    if (move.stat_changes.length) {
      const who = statTarget(move) === 'user' ? side : foe
      const chance = move.meta?.stat_chance || 100
      if (cur(who).hp > 0 && rng() * 100 < chance) applyStages(who, move.stat_changes)
    }
    faintCheck(foe)
  }

  const residual = (side: Side) => {
    const mon = cur(side)
    if (mon.hp <= 0) return
    if (mon.status === 'burn' || mon.status === 'poison') {
      const dmg = Math.min(mon.hp, Math.max(1, Math.floor(mon.maxHp / (mon.status === 'burn' ? 16 : 8))))
      mon.hp -= dmg
      emit({
        kind: 'damage',
        side,
        slot: active[side],
        hp: mon.hp,
        amount: dmg,
        mult: 1,
        crit: false,
        text: `${monName(side)} is hurt by its ${mon.status === 'burn' ? 'burn' : 'poison'}!`,
      })
      faintCheck(side)
    }
  }

  const alive = (side: Side) => teams[side].some((m) => m.hp > 0)
  const maxTurns = opts.maxTurns ?? 200
  let turn = 0
  let winner: Side | null = null

  while (winner === null) {
    turn++
    emit({ kind: 'turn', turn, text: `Turn ${turn}` })
    const choice: [ApiMove, ApiMove] = [chooseMove(chart, cur(0), cur(1), rng), chooseMove(chart, cur(1), cur(0), rng)]
    const order: Side[] = (() => {
      const [p0, p1] = [choice[0].priority, choice[1].priority]
      if (p0 !== p1) return p0 > p1 ? [0, 1] : [1, 0]
      const [s0, s1] = [effectiveStat(cur(0), 'speed'), effectiveStat(cur(1), 'speed')]
      if (s0 !== s1) return s0 > s1 ? [0, 1] : [1, 0]
      return rng() < 0.5 ? [0, 1] : [1, 0]
    })()
    for (const side of order) {
      if (cur(side).hp <= 0 || cur((1 - side) as Side).hp <= 0) continue
      if (beforeMove(side)) performMove(side, choice[side])
    }
    for (const side of order) residual(side)

    for (const side of [0, 1] as Side[]) {
      if (cur(side).hp > 0) continue
      const next = teams[side].findIndex((m) => m.hp > 0)
      if (next === -1) continue
      active[side] = next
      emit({ kind: 'switch', side, slot: next, text: `${names[side]} sent out ${teams[side][next].name}!` })
    }

    if (!alive(0) || !alive(1)) winner = alive(0) ? 0 : 1
    else if (turn >= maxTurns) {
      const frac = (side: Side) => teams[side].reduce((s, m) => s + m.hp / m.maxHp, 0)
      winner = frac(0) > frac(1) ? 0 : 1
      emit({ kind: 'info', text: 'The battle dragged on too long — the judges decide!' })
    }
  }
  emit({ kind: 'end', winner, text: winner === 0 ? `You defeated ${names[1]}!` : `You were defeated by ${names[1]}…` })
  return { winner, turns: turn, events, teams }
}
