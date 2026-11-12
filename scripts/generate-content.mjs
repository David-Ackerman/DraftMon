// Expands scripts/content.mjs into PokeAPI-shaped JSON + SVG icons.
// Usage: node scripts/generate-content.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CREATURES, MOVES, REGIONS, TRAINERS, TYPE_CHART, TYPE_COLORS } from './content.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'src', 'data')
const spriteDir = join(root, 'public', 'sprites')
const trainerDir = join(root, 'public', 'trainers')
for (const d of [dataDir, spriteDir, trainerDir]) mkdirSync(d, { recursive: true })

const ref = (name) => ({ name, url: '' })
const en = { name: 'en', url: '' }
const write = (file, obj) => writeFileSync(join(dataDir, file), JSON.stringify(obj, null, 2) + '\n')
const titleCase = (slug) => slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')

// ---------------------------------------------------------------- types
const typeNames = Object.keys(TYPE_CHART)
const types = typeNames.map((name, i) => {
  const rel = TYPE_CHART[name]
  const from = (key) => typeNames.filter((t) => (TYPE_CHART[t][key] ?? []).includes(name)).map(ref)
  return {
    id: i + 1,
    name,
    damage_relations: {
      double_damage_to: (rel.double ?? []).map(ref),
      half_damage_to: (rel.half ?? []).map(ref),
      no_damage_to: (rel.none ?? []).map(ref),
      double_damage_from: from('double'),
      half_damage_from: from('half'),
      no_damage_from: from('none'),
    },
  }
})
write('types.json', types)

// ---------------------------------------------------------------- moves
const moves = MOVES.map(([name, type, cls, power, accuracy, pp, x = {}], i) => {
  const statChanges = (x.stats ?? []).map(([stat, change]) => ({ change, stat: ref(stat) }))
  let category = 'damage'
  if (cls === 'status') {
    if (x.ailment) category = 'ailment'
    else if (x.heal) category = 'heal'
    else category = 'net-good-stats'
  } else if (x.ailment) category = 'damage+ailment'
  else if (x.drain) category = 'damage+heal'
  else if (statChanges.length) category = x.self ? 'damage+raise' : 'damage+lower'
  const target = cls === 'status' && x.self ? 'user' : 'selected-pokemon'
  const effect = [
    power ? `Deals ${power} power ${cls} damage.` : '',
    x.ailment ? (x.chance ? `${x.chance}% chance to ${x.ailment}.` : `Inflicts ${x.ailment}.`) : '',
    statChanges.map((s) => `${s.change > 0 ? 'Raises' : 'Lowers'} ${x.self ? "user's" : "target's"} ${s.stat.name} by ${Math.abs(s.change)}.`).join(' '),
    x.heal ? `Heals ${x.heal}% of max HP.` : '',
    x.drain ? `Recovers ${x.drain}% of damage dealt.` : '',
    x.priority ? 'Usually goes first.' : '',
    x.crit ? 'High critical-hit ratio.' : '',
  ].filter(Boolean).join(' ')
  return {
    id: i + 1,
    name,
    accuracy,
    power,
    pp,
    priority: x.priority ?? 0,
    damage_class: ref(cls),
    type: ref(type),
    target: ref(target),
    effect_chance: x.chance || null,
    meta: {
      ailment: ref(x.ailment ?? 'none'),
      ailment_chance: x.chance ?? 0,
      category: ref(category),
      crit_rate: x.crit ?? 0,
      drain: x.drain ?? 0,
      flinch_chance: 0,
      healing: x.heal ?? 0,
      stat_chance: 0,
      min_hits: null,
      max_hits: null,
      min_turns: null,
      max_turns: null,
    },
    stat_changes: statChanges,
    effect_entries: [{ effect, short_effect: effect, language: en }],
  }
})
write('moves.json', moves)
const moveNames = new Set(moves.map((m) => m.name))

// ---------------------------------------------------------------- pokemon
const STAT_NAMES = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
const pokemon = CREATURES.map(([name, , typeList, stats, ability, moveList], i) => {
  for (const m of moveList) if (!moveNames.has(m)) throw new Error(`${name}: unknown move ${m}`)
  const bst = stats.reduce((a, b) => a + b, 0)
  return {
    id: i + 1,
    name,
    base_experience: Math.round(bst / 3),
    height: 5 + (i % 15),
    weight: 50 + ((i * 37) % 900),
    order: i + 1,
    species: ref(name),
    types: typeList.map((t, slot) => ({ slot: slot + 1, type: ref(t) })),
    stats: stats.map((base_stat, k) => ({ base_stat, effort: 0, stat: ref(STAT_NAMES[k]) })),
    abilities: [{ ability: ref(ability), is_hidden: false, slot: 1 }],
    moves: moveList.map((m) => ({ move: ref(m), version_group_details: [] })),
    sprites: {
      front_default: `/sprites/${name}.svg`,
      other: { 'official-artwork': { front_default: `/sprites/${name}.svg` } },
    },
  }
})
write('pokemon.json', pokemon)

// ---------------------------------------------------------------- regions (pokedexes)
const regions = REGIONS.map(([name, label, description], i) => ({
  id: i + 1,
  name,
  is_main_series: true,
  names: [{ name: label, language: en }],
  descriptions: [{ description, language: en }],
  pokemon_entries: CREATURES.filter((c) => c[1] === name).map((c, k) => ({
    entry_number: k + 1,
    pokemon_species: ref(c[0]),
  })),
}))
write('regions.json', regions)

// ---------------------------------------------------------------- trainers
const known = new Set(CREATURES.map((c) => c[0]))
const trainers = TRAINERS.map(([id, name, title, tier, level, team]) => {
  for (const p of team) if (!known.has(p)) throw new Error(`${id}: unknown creature ${p}`)
  return { id, name, title, tier, level, sprite: `/trainers/${id}.svg`, pokemon: team.map((p) => ({ name: p })) }
})
write('trainers.json', trainers)

// ---------------------------------------------------------------- sprites
function hash(str) {
  let h = 2166136261
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}
function rng(seed) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v + amt))))
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
}

function creatureSvg(name, typeList, bst) {
  const r = rng(hash(name))
  const main = TYPE_COLORS[typeList[0]]
  const accent = TYPE_COLORS[typeList[1] ?? typeList[0]]
  const has = (t) => typeList.includes(t)
  const size = bst > 500 ? 1.08 : bst > 400 ? 1 : 0.88
  const w = (26 + r() * 8) * size
  const h = (24 + r() * 8) * size
  const cx = 48
  const cy = 56
  const outline = shade(main, -70)
  const parts = []
  const back = []

  // wings / fins / tails behind the body
  if (has('flying') || has('bug') || has('fairy') || (has('dragon') && r() > 0.3)) {
    const wc = has('bug') || has('fairy') ? shade(accent, 60) : shade(accent, 10)
    const op = has('bug') || has('fairy') ? 0.75 : 1
    back.push(
      `<path d="M${cx - w * 0.6} ${cy - 4} Q ${cx - w - 18} ${cy - h - 6} ${cx - w - 10} ${cy + 10} Q ${cx - w * 0.8} ${cy + 4} ${cx - w * 0.6} ${cy + 6} Z" fill="${wc}" fill-opacity="${op}" stroke="${outline}" stroke-width="2"/>`,
      `<path d="M${cx + w * 0.6} ${cy - 4} Q ${cx + w + 18} ${cy - h - 6} ${cx + w + 10} ${cy + 10} Q ${cx + w * 0.8} ${cy + 4} ${cx + w * 0.6} ${cy + 6} Z" fill="${wc}" fill-opacity="${op}" stroke="${outline}" stroke-width="2"/>`,
    )
  }
  if (has('water')) {
    back.push(`<path d="M${cx} ${cy - h + 2} Q ${cx + 6} ${cy - h - 16} ${cx + 16} ${cy - h - 10} Q ${cx + 10} ${cy - h + 2} ${cx + 8} ${cy - h + 6} Z" fill="${shade(accent, -10)}" stroke="${outline}" stroke-width="2"/>`)
  }
  if (has('electric')) {
    back.push(`<path d="M${cx + w - 4} ${cy + 6} l 14 -10 l -4 10 l 12 -6 l -14 18 l 4 -10 z" fill="#F7D02C" stroke="${outline}" stroke-width="2" stroke-linejoin="round"/>`)
  }
  if (has('fire')) {
    back.push(`<path d="M${cx - 10} ${cy - h + 6} Q ${cx - 14} ${cy - h - 14} ${cx - 2} ${cy - h - 22} Q ${cx - 2} ${cy - h - 10} ${cx + 6} ${cy - h - 16} Q ${cx + 16} ${cy - h - 4} ${cx + 10} ${cy - h + 6} Z" fill="#F5A623" stroke="#C2410C" stroke-width="2"/>`)
  }

  // body
  const ghostly = has('ghost')
  if (ghostly) {
    const by = cy + h * 0.8
    parts.push(
      `<path d="M${cx - w} ${cy} A ${w} ${h} 0 0 1 ${cx + w} ${cy} L ${cx + w} ${by} q -${w / 4} -8 -${w / 2} 0 q -${w / 4} 8 -${w / 2} 0 q -${w / 4} -8 -${w / 2} 0 q -${w / 4} 8 -${w / 2} 0 Z" fill="${main}" fill-opacity="0.92" stroke="${outline}" stroke-width="2.5"/>`,
    )
  } else {
    parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${w}" ry="${h}" fill="${main}" stroke="${outline}" stroke-width="2.5"/>`)
    // feet
    parts.push(
      `<ellipse cx="${cx - w * 0.5}" cy="${cy + h - 2}" rx="7" ry="4" fill="${shade(main, -30)}" stroke="${outline}" stroke-width="2"/>`,
      `<ellipse cx="${cx + w * 0.5}" cy="${cy + h - 2}" rx="7" ry="4" fill="${shade(main, -30)}" stroke="${outline}" stroke-width="2"/>`,
    )
  }
  // belly
  parts.push(`<ellipse cx="${cx}" cy="${cy + h * 0.35}" rx="${w * 0.55}" ry="${h * 0.45}" fill="${shade(accent, 70)}" fill-opacity="0.85"/>`)

  // ears / horns / leaf / crystals on head
  const earStyle = Math.floor(r() * 3)
  if (has('rock') || has('steel') || has('ground') || has('dragon')) {
    const hc = has('steel') ? '#D4D4E2' : shade(accent, -20)
    back.push(
      `<path d="M${cx - w * 0.45} ${cy - h * 0.7} L ${cx - w * 0.6} ${cy - h - 14} L ${cx - w * 0.2} ${cy - h * 0.85} Z" fill="${hc}" stroke="${outline}" stroke-width="2" stroke-linejoin="round"/>`,
      `<path d="M${cx + w * 0.45} ${cy - h * 0.7} L ${cx + w * 0.6} ${cy - h - 14} L ${cx + w * 0.2} ${cy - h * 0.85} Z" fill="${hc}" stroke="${outline}" stroke-width="2" stroke-linejoin="round"/>`,
    )
  } else if (has('grass')) {
    back.push(`<path d="M${cx} ${cy - h + 2} Q ${cx - 18} ${cy - h - 18} ${cx - 2} ${cy - h - 24} Q ${cx + 8} ${cy - h - 8} ${cx} ${cy - h + 2} Z" fill="#4E9A2A" stroke="#2F5E17" stroke-width="2"/>`)
  } else if (has('ice')) {
    back.push(
      `<path d="M${cx - 10} ${cy - h + 4} l -4 -16 l 8 8 z" fill="#E0F7FA" stroke="${outline}" stroke-width="2" stroke-linejoin="round"/>`,
      `<path d="M${cx + 10} ${cy - h + 4} l 4 -16 l -8 8 z" fill="#E0F7FA" stroke="${outline}" stroke-width="2" stroke-linejoin="round"/>`,
    )
  } else if (earStyle === 0) {
    back.push(
      `<path d="M${cx - w * 0.6} ${cy - h * 0.5} L ${cx - w * 0.75} ${cy - h - 10} L ${cx - w * 0.15} ${cy - h * 0.9} Z" fill="${main}" stroke="${outline}" stroke-width="2" stroke-linejoin="round"/>`,
      `<path d="M${cx + w * 0.6} ${cy - h * 0.5} L ${cx + w * 0.75} ${cy - h - 10} L ${cx + w * 0.15} ${cy - h * 0.9} Z" fill="${main}" stroke="${outline}" stroke-width="2" stroke-linejoin="round"/>`,
    )
  } else if (earStyle === 1) {
    back.push(
      `<circle cx="${cx - w * 0.6}" cy="${cy - h * 0.75}" r="8" fill="${main}" stroke="${outline}" stroke-width="2"/>`,
      `<circle cx="${cx + w * 0.6}" cy="${cy - h * 0.75}" r="8" fill="${main}" stroke="${outline}" stroke-width="2"/>`,
    )
  }

  // face
  const eyeY = cy - h * 0.15
  const eyeDx = w * (0.32 + r() * 0.1)
  const eyeR = 4.5 + r() * 2
  const fierce = bst > 480
  for (const sx of [-1, 1]) {
    const ex = cx + sx * eyeDx
    parts.push(`<ellipse cx="${ex}" cy="${eyeY}" rx="${eyeR}" ry="${eyeR * 1.15}" fill="#fff" stroke="${outline}" stroke-width="1.5"/>`)
    parts.push(`<circle cx="${ex + sx * 0.8}" cy="${eyeY + 0.8}" r="${eyeR * 0.6}" fill="#1f1f2e"/>`)
    parts.push(`<circle cx="${ex + sx * 0.8 - 1.2}" cy="${eyeY - 1}" r="${eyeR * 0.22}" fill="#fff"/>`)
    if (fierce) {
      parts.push(`<path d="M${ex - sx * eyeR * 1.2} ${eyeY - eyeR * 1.6} L ${ex + sx * eyeR * 1.1} ${eyeY - eyeR * 0.9}" stroke="${outline}" stroke-width="2.5" stroke-linecap="round"/>`)
    }
  }
  const mouthY = eyeY + eyeR + 5
  if (fierce || has('dark') || has('dragon')) {
    parts.push(`<path d="M${cx - 6} ${mouthY} Q ${cx} ${mouthY + 5} ${cx + 6} ${mouthY}" fill="none" stroke="${outline}" stroke-width="2" stroke-linecap="round"/>`)
    parts.push(`<path d="M${cx - 4} ${mouthY + 1} l 1.5 3 l 1.5 -2.5 M${cx + 4} ${mouthY + 1} l -1.5 3 l -1.5 -2.5" fill="#fff" stroke="#fff" stroke-width="1"/>`)
  } else {
    parts.push(`<path d="M${cx - 4} ${mouthY} Q ${cx} ${mouthY + 4} ${cx + 4} ${mouthY}" fill="none" stroke="${outline}" stroke-width="2" stroke-linecap="round"/>`)
  }
  if (!fierce) {
    parts.push(
      `<ellipse cx="${cx - eyeDx - 4}" cy="${mouthY}" rx="3.5" ry="2" fill="#ff7b9c" fill-opacity="0.55"/>`,
      `<ellipse cx="${cx + eyeDx + 4}" cy="${mouthY}" rx="3.5" ry="2" fill="#ff7b9c" fill-opacity="0.55"/>`,
    )
  }
  // markings
  if (has('poison')) {
    parts.push(`<circle cx="${cx - w * 0.55}" cy="${cy + 2}" r="3" fill="${shade(TYPE_COLORS.poison, 40)}"/><circle cx="${cx + w * 0.5}" cy="${cy + 6}" r="2.5" fill="${shade(TYPE_COLORS.poison, 40)}"/>`)
  }
  if (has('fighting')) {
    parts.push(`<rect x="${cx - w * 0.75}" y="${cy - h * 0.55}" width="${w * 1.5}" height="5" rx="2" fill="${TYPE_COLORS.fighting}" stroke="${outline}" stroke-width="1.5"/>`)
  }
  if (has('psychic')) {
    parts.push(`<circle cx="${cx}" cy="${cy - h * 0.6}" r="3.5" fill="${TYPE_COLORS.psychic}" stroke="${outline}" stroke-width="1.5"/>`)
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
<ellipse cx="48" cy="${cy + h + 4}" rx="${w * 0.9}" ry="4" fill="#000" fill-opacity="0.15"/>
${back.join('\n')}
${parts.join('\n')}
</svg>
`
}

for (const [name, , typeList, stats] of CREATURES) {
  writeFileSync(join(spriteDir, `${name}.svg`), creatureSvg(name, typeList, stats.reduce((a, b) => a + b, 0)))
}

const TIER_COLORS = { 1: '#4f8cff', 2: '#c04fff', 3: '#ffb020' }
for (const [id, name, , tier] of TRAINERS) {
  const r = rng(hash(id))
  const skin = ['#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#FFDBAC'][Math.floor(r() * 5)]
  const hair = ['#2b1d0e', '#6b3e1f', '#d9a441', '#b03a2e', '#3b3b6d', '#e8e8e8'][Math.floor(r() * 6)]
  const bg = TIER_COLORS[tier]
  const initial = name.replace('Dr. ', '')[0]
  writeFileSync(
    join(trainerDir, `${id}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
<circle cx="48" cy="48" r="46" fill="${bg}"/>
<path d="M18 92 Q 48 54 78 92 Z" fill="${shade(bg, -50)}"/>
<circle cx="48" cy="44" r="20" fill="${skin}"/>
<path d="M27 42 Q 30 18 48 20 Q 68 18 69 42 Q 60 30 48 31 Q 36 30 27 42 Z" fill="${hair}"/>
<circle cx="41" cy="46" r="2.5" fill="#1f1f2e"/><circle cx="55" cy="46" r="2.5" fill="#1f1f2e"/>
<path d="M42 55 Q 48 59 54 55" stroke="#1f1f2e" stroke-width="2" fill="none" stroke-linecap="round"/>
<text x="48" y="88" font-family="sans-serif" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">${initial}</text>
</svg>
`,
  )
}

console.log(`types ${types.length}, moves ${moves.length}, pokemon ${pokemon.length}, regions ${regions.length}, trainers ${trainers.length}`)
console.log(`labels: ${REGIONS.map((r) => titleCase(r[0])).join(', ')}`)
