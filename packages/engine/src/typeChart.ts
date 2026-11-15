import type { ApiType } from '@draftmon/content'

/** attacker type -> defender type -> multiplier (missing = 1) */
export type TypeChart = Map<string, Map<string, number>>

export function buildTypeChart(types: ApiType[]): TypeChart {
  const chart: TypeChart = new Map()
  for (const t of types) {
    const row = new Map<string, number>()
    for (const d of t.damage_relations.double_damage_to) row.set(d.name, 2)
    for (const d of t.damage_relations.half_damage_to) row.set(d.name, 0.5)
    for (const d of t.damage_relations.no_damage_to) row.set(d.name, 0)
    chart.set(t.name, row)
  }
  return chart
}

/** Multiplier of an attack type against a (possibly dual-typed) defender. */
export function effectiveness(
  chart: TypeChart,
  attackType: string,
  defenderTypes: string[],
): number {
  const row = chart.get(attackType)
  if (!row) return 1
  return defenderTypes.reduce((mult, t) => mult * (row.get(t) ?? 1), 1)
}

export function effectivenessLabel(mult: number): string | null {
  if (mult === 0) return 'It had no effect…'
  if (mult >= 2) return "It's super effective!"
  if (mult < 1) return "It's not very effective…"
  return null
}

/** For the UI: which types hit this defender for >1x, <1x, 0x. */
export function defensiveProfile(chart: TypeChart, defenderTypes: string[]) {
  const weak: [string, number][] = []
  const resist: [string, number][] = []
  const immune: string[] = []
  for (const atk of chart.keys()) {
    const m = effectiveness(chart, atk, defenderTypes)
    if (m === 0) immune.push(atk)
    else if (m > 1) weak.push([atk, m])
    else if (m < 1) resist.push([atk, m])
  }
  return { weak, resist, immune }
}
