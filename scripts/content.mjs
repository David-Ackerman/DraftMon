// Original game content in compact form. `generate-content.mjs` expands it into
// PokeAPI-shaped JSON (src/data/*.json) and SVG icons (public/sprites, public/trainers).

// ---------------------------------------------------------------------------
// Type chart (attacker -> defender multipliers). Only non-1x entries listed.
// ---------------------------------------------------------------------------
export const TYPE_CHART = {
  normal: { half: ['rock', 'steel'], none: ['ghost'] },
  fire: { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'] },
  water: { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'] },
  electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], none: ['ground'] },
  grass: {
    double: ['water', 'ground', 'rock'],
    half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
  },
  ice: { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'] },
  fighting: {
    double: ['normal', 'ice', 'rock', 'dark', 'steel'],
    half: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    none: ['ghost'],
  },
  poison: { double: ['grass', 'fairy'], half: ['poison', 'ground', 'rock', 'ghost'], none: ['steel'] },
  ground: { double: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], none: ['flying'] },
  flying: { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'] },
  psychic: { double: ['fighting', 'poison'], half: ['psychic', 'steel'], none: ['dark'] },
  bug: {
    double: ['grass', 'psychic', 'dark'],
    half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
  },
  rock: { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'] },
  ghost: { double: ['psychic', 'ghost'], half: ['dark'], none: ['normal'] },
  dragon: { double: ['dragon'], half: ['steel'], none: ['fairy'] },
  dark: { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'fairy'] },
  steel: { double: ['ice', 'rock', 'fairy'], half: ['fire', 'water', 'electric', 'steel'] },
  fairy: { double: ['fighting', 'dragon', 'dark'], half: ['fire', 'poison', 'steel'] },
}

// ---------------------------------------------------------------------------
// Moves: [name, type, class, power, accuracy, pp, extras]
// extras: priority, ailment, chance, crit, drain, heal, stats [[stat, change]], self (stat target)
// ---------------------------------------------------------------------------
const P = 'physical'
const S = 'special'
const X = 'status'
export const MOVES = [
  // normal
  ['bash', 'normal', P, 40, 100, 35],
  ['quick-jab', 'normal', P, 40, 100, 30, { priority: 1 }],
  ['crushing-blow', 'normal', P, 85, 100, 15],
  ['rampage-slam', 'normal', P, 110, 85, 10],
  ['hyper-roar', 'normal', S, 90, 100, 10],
  ['battle-focus', 'normal', X, null, null, 20, { stats: [['attack', 2]], self: true }],
  ['second-wind', 'normal', X, null, null, 10, { heal: 50, self: true }],
  // fire
  ['cinder', 'fire', S, 40, 100, 25, { ailment: 'burn', chance: 10 }],
  ['flame-lash', 'fire', P, 75, 100, 15, { ailment: 'burn', chance: 10 }],
  ['blaze-wave', 'fire', S, 90, 100, 15, { ailment: 'burn', chance: 10 }],
  ['inferno-burst', 'fire', S, 120, 85, 5, { ailment: 'burn', chance: 20 }],
  ['magma-fist', 'fire', P, 95, 95, 10],
  ['scorch-veil', 'fire', X, null, 85, 15, { ailment: 'burn', chance: 0 }],
  // water
  ['splash-shot', 'water', S, 40, 100, 25],
  ['tide-slam', 'water', P, 80, 100, 15],
  ['torrent-beam', 'water', S, 90, 100, 15],
  ['tsunami-crash', 'water', S, 120, 80, 5],
  ['riptide-claw', 'water', P, 95, 95, 10],
  // grass
  ['leaf-dart', 'grass', S, 40, 100, 25],
  ['thorn-whip', 'grass', P, 75, 100, 15],
  ['verdant-beam', 'grass', S, 90, 100, 15],
  ['sap-drain', 'grass', S, 70, 100, 10, { drain: 50 }],
  ['timber-crash', 'grass', P, 120, 90, 5],
  ['spore-cloud', 'grass', X, null, 75, 15, { ailment: 'sleep', chance: 0 }],
  // electric
  ['static-jab', 'electric', P, 40, 100, 30, { ailment: 'paralysis', chance: 10 }],
  ['volt-lance', 'electric', P, 85, 100, 15, { ailment: 'paralysis', chance: 10 }],
  ['thunder-arc', 'electric', S, 90, 100, 15, { ailment: 'paralysis', chance: 10 }],
  ['storm-surge', 'electric', S, 120, 75, 5, { ailment: 'paralysis', chance: 30 }],
  ['jolt-wave', 'electric', X, null, 90, 20, { ailment: 'paralysis', chance: 0 }],
  // ice
  ['frost-chip', 'ice', S, 40, 100, 25, { ailment: 'freeze', chance: 10 }],
  ['glacier-fang', 'ice', P, 80, 95, 15, { ailment: 'freeze', chance: 10 }],
  ['rime-ray', 'ice', S, 90, 100, 10, { ailment: 'freeze', chance: 10 }],
  ['avalanche-crush', 'ice', P, 110, 85, 5],
  // fighting
  ['palm-strike', 'fighting', P, 40, 100, 30, { priority: 1 }],
  ['iron-knuckle', 'fighting', P, 80, 100, 15],
  ['titan-kick', 'fighting', P, 120, 85, 5],
  ['aura-pulse', 'fighting', S, 85, 100, 15],
  ['fighting-stance', 'fighting', X, null, null, 20, { stats: [['attack', 1], ['defense', 1]], self: true }],
  // poison
  ['venom-sting', 'poison', P, 40, 100, 30, { ailment: 'poison', chance: 30 }],
  ['toxic-spit', 'poison', S, 80, 100, 15, { ailment: 'poison', chance: 30 }],
  ['blight-fang', 'poison', P, 85, 100, 15, { ailment: 'poison', chance: 20 }],
  ['miasma', 'poison', X, null, 90, 20, { ailment: 'poison', chance: 0 }],
  // ground
  ['dust-kick', 'ground', P, 40, 100, 30],
  ['quake-stomp', 'ground', P, 95, 100, 10],
  ['mudslide', 'ground', S, 85, 100, 10],
  ['fault-line', 'ground', P, 120, 85, 5],
  // flying
  ['gust-cut', 'flying', S, 40, 100, 30],
  ['sky-dive', 'flying', P, 85, 95, 15],
  ['cyclone', 'flying', S, 95, 95, 10],
  ['talon-rush', 'flying', P, 120, 90, 5],
  ['updraft', 'flying', X, null, null, 15, { stats: [['speed', 2]], self: true }],
  // psychic
  ['mind-pulse', 'psychic', S, 50, 100, 25],
  ['psy-lance', 'psychic', S, 90, 100, 10],
  ['mindquake', 'psychic', S, 120, 85, 5],
  ['psi-blade', 'psychic', P, 85, 100, 15],
  ['focus-trance', 'psychic', X, null, null, 20, { stats: [['special-attack', 1], ['special-defense', 1]], self: true }],
  // bug
  ['mandible', 'bug', P, 40, 100, 30],
  ['swarm-rush', 'bug', P, 85, 100, 15],
  ['chitin-beam', 'bug', S, 90, 100, 10],
  // rock
  ['pebble-toss', 'rock', P, 40, 100, 30],
  ['boulder-smash', 'rock', P, 100, 85, 10],
  ['crystal-shard', 'rock', S, 85, 95, 10, { crit: 1 }],
  // ghost
  ['haunt', 'ghost', S, 40, 100, 30],
  ['shade-claw', 'ghost', P, 75, 100, 15, { crit: 1 }],
  ['phantom-wave', 'ghost', S, 90, 100, 15],
  ['dread-gaze', 'ghost', X, null, 100, 20, { stats: [['special-defense', -2]] }],
  // dragon
  ['drake-claw', 'dragon', P, 80, 100, 15],
  ['wyrm-breath', 'dragon', S, 90, 100, 10],
  ['cataclysm', 'dragon', S, 130, 90, 5, { stats: [['special-attack', -2]], self: true }],
  ['scale-dance', 'dragon', X, null, null, 20, { stats: [['attack', 1], ['speed', 1]], self: true }],
  // dark
  ['sneak-bite', 'dark', P, 40, 100, 30, { priority: 1 }],
  ['shadow-maul', 'dark', P, 85, 100, 15],
  ['night-pulse', 'dark', S, 85, 100, 15],
  ['sinister-plot', 'dark', X, null, null, 20, { stats: [['special-attack', 2]], self: true }],
  // steel
  ['iron-tap', 'steel', P, 50, 100, 30],
  ['alloy-slam', 'steel', P, 90, 100, 15],
  ['chrome-ray', 'steel', S, 85, 100, 10],
  ['plating', 'steel', X, null, null, 15, { stats: [['defense', 2]], self: true }],
  // fairy
  ['glimmer', 'fairy', S, 40, 100, 30],
  ['lunar-glow', 'fairy', S, 90, 100, 15],
  ['pixie-strike', 'fairy', P, 85, 100, 15],
  ['charm-veil', 'fairy', X, null, 100, 20, { stats: [['attack', -2]] }],
]

// ---------------------------------------------------------------------------
// Regions (stored as PokeAPI "pokedex" resources)
// ---------------------------------------------------------------------------
export const REGIONS = [
  ['emberreach', 'Emberreach', 'A chain of volcanoes and ash fields where fire and stone creatures thrive.'],
  ['frostmere', 'Frostmere', 'A frozen northern lake ringed by glaciers and silent, haunted pines.'],
  ['verdant-hollow', 'Verdant Hollow', 'An ancient forest of giant trees, glowing fungi and buzzing swarms.'],
  ['tidecrest-isles', 'Tidecrest Isles', 'Storm-battered islands surrounded by reefs and open sea.'],
  ['duskmarsh', 'Duskmarsh', 'A misty swamp where the sun barely reaches and strange lights drift.'],
  ['ironspire', 'Ironspire', 'A sprawling city of towers, factories and neon-lit alleys.'],
]

// ---------------------------------------------------------------------------
// Creatures: [name, region, types, [hp, atk, def, spa, spd, spe], ability, moves]
// ---------------------------------------------------------------------------
export const CREATURES = [
  // Emberreach
  ['cindrel', 'emberreach', ['fire'], [40, 52, 43, 60, 50, 65], 'kindling', ['cinder', 'bash', 'flame-lash', 'quick-jab']],
  ['pyrrhound', 'emberreach', ['fire'], [75, 105, 70, 60, 65, 95], 'blaze-heart', ['flame-lash', 'magma-fist', 'sneak-bite', 'battle-focus']],
  ['magmaw', 'emberreach', ['fire', 'rock'], [90, 110, 100, 70, 70, 50], 'molten-hide', ['magma-fist', 'boulder-smash', 'quake-stomp', 'plating']],
  ['cragling', 'emberreach', ['rock'], [50, 70, 85, 30, 40, 25], 'sturdy-shell', ['pebble-toss', 'dust-kick', 'bash', 'plating']],
  ['basaltor', 'emberreach', ['rock', 'ground'], [100, 120, 130, 50, 60, 40], 'sturdy-shell', ['boulder-smash', 'fault-line', 'iron-knuckle', 'plating']],
  ['ashwyrm', 'emberreach', ['dragon', 'fire'], [85, 95, 80, 110, 85, 95], 'blaze-heart', ['wyrm-breath', 'inferno-burst', 'drake-claw', 'scale-dance']],
  ['scorchfist', 'emberreach', ['fighting', 'fire'], [80, 115, 75, 60, 70, 90], 'iron-will', ['iron-knuckle', 'flame-lash', 'palm-strike', 'fighting-stance']],
  ['smoldrake', 'emberreach', ['dragon'], [60, 75, 60, 65, 55, 70], 'kindling', ['drake-claw', 'cinder', 'bash', 'scale-dance']],
  ['obsidjack', 'emberreach', ['dark', 'rock'], [70, 100, 80, 55, 70, 100], 'night-hunter', ['shadow-maul', 'boulder-smash', 'sneak-bite', 'battle-focus']],
  ['terrapyre', 'emberreach', ['ground', 'fire'], [95, 90, 105, 95, 85, 50], 'molten-hide', ['quake-stomp', 'blaze-wave', 'mudslide', 'second-wind']],
  // Frostmere
  ['frostkit', 'frostmere', ['ice'], [45, 55, 45, 55, 50, 70], 'snow-coat', ['frost-chip', 'bash', 'glacier-fang', 'quick-jab']],
  ['glacirn', 'frostmere', ['ice', 'steel'], [85, 95, 120, 60, 90, 40], 'cold-forge', ['avalanche-crush', 'alloy-slam', 'glacier-fang', 'plating']],
  ['rimeowl', 'frostmere', ['ice', 'flying'], [70, 60, 65, 105, 80, 95], 'snow-coat', ['rime-ray', 'cyclone', 'frost-chip', 'updraft']],
  ['brinewhal', 'frostmere', ['water', 'ice'], [110, 80, 85, 95, 90, 55], 'thick-blubber', ['torrent-beam', 'rime-ray', 'tide-slam', 'second-wind']],
  ['wraithfrost', 'frostmere', ['ghost', 'ice'], [60, 65, 60, 115, 90, 110], 'cursed-chill', ['phantom-wave', 'rime-ray', 'dread-gaze', 'haunt']],
  ['aurorym', 'frostmere', ['psychic', 'ice'], [80, 55, 75, 120, 110, 85], 'aurora-mind', ['psy-lance', 'rime-ray', 'focus-trance', 'mindquake']],
  ['drifmuff', 'frostmere', ['normal'], [55, 60, 55, 40, 50, 60], 'thick-blubber', ['bash', 'quick-jab', 'crushing-blow', 'battle-focus']],
  ['tundrax', 'frostmere', ['normal', 'ice'], [105, 110, 90, 50, 75, 75], 'snow-coat', ['crushing-blow', 'avalanche-crush', 'rampage-slam', 'battle-focus']],
  ['chillshade', 'frostmere', ['ghost'], [45, 50, 45, 70, 60, 75], 'cursed-chill', ['haunt', 'shade-claw', 'dread-gaze', 'mind-pulse']],
  ['cryostag', 'frostmere', ['steel', 'psychic'], [85, 100, 100, 85, 95, 85], 'cold-forge', ['alloy-slam', 'psi-blade', 'chrome-ray', 'focus-trance']],
  // Verdant Hollow
  ['sproutle', 'verdant-hollow', ['grass'], [45, 49, 49, 60, 60, 45], 'overgrowth', ['leaf-dart', 'bash', 'sap-drain', 'spore-cloud']],
  ['thornback', 'verdant-hollow', ['grass', 'fighting'], [80, 110, 95, 55, 70, 70], 'overgrowth', ['thorn-whip', 'iron-knuckle', 'timber-crash', 'fighting-stance']],
  ['bloomira', 'verdant-hollow', ['grass', 'fairy'], [75, 50, 70, 110, 105, 85], 'petal-veil', ['verdant-beam', 'lunar-glow', 'sap-drain', 'spore-cloud']],
  ['mothquill', 'verdant-hollow', ['bug', 'flying'], [60, 50, 55, 95, 75, 95], 'dust-wings', ['chitin-beam', 'cyclone', 'gust-cut', 'focus-trance']],
  ['larvine', 'verdant-hollow', ['bug'], [45, 55, 50, 30, 40, 45], 'swarm-sense', ['mandible', 'swarm-rush', 'bash', 'quick-jab']],
  ['hornvex', 'verdant-hollow', ['bug', 'steel'], [80, 125, 110, 40, 70, 70], 'swarm-sense', ['swarm-rush', 'alloy-slam', 'iron-knuckle', 'battle-focus']],
  ['pixwing', 'verdant-hollow', ['fairy', 'flying'], [55, 45, 55, 85, 80, 110], 'petal-veil', ['glimmer', 'gust-cut', 'lunar-glow', 'charm-veil']],
  ['fungoss', 'verdant-hollow', ['poison', 'grass'], [90, 70, 85, 90, 95, 40], 'spore-skin', ['toxic-spit', 'sap-drain', 'miasma', 'spore-cloud']],
  ['elkenwood', 'verdant-hollow', ['grass', 'normal'], [95, 105, 85, 75, 80, 85], 'overgrowth', ['timber-crash', 'crushing-blow', 'quake-stomp', 'second-wind']],
  ['featherwisp', 'verdant-hollow', ['flying', 'normal'], [50, 60, 45, 40, 45, 85], 'dust-wings', ['gust-cut', 'quick-jab', 'sky-dive', 'updraft']],
  // Tidecrest Isles
  ['puddlit', 'tidecrest-isles', ['water'], [50, 45, 50, 60, 55, 55], 'tide-born', ['splash-shot', 'bash', 'torrent-beam', 'second-wind']],
  ['reefjaw', 'tidecrest-isles', ['water', 'dark'], [80, 115, 80, 60, 70, 95], 'night-hunter', ['riptide-claw', 'shadow-maul', 'sneak-bite', 'glacier-fang']],
  ['gullstrike', 'tidecrest-isles', ['flying', 'water'], [65, 95, 60, 60, 60, 110], 'tide-born', ['sky-dive', 'tide-slam', 'talon-rush', 'quick-jab']],
  ['voltfin', 'tidecrest-isles', ['electric', 'water'], [75, 60, 70, 105, 80, 100], 'static-skin', ['thunder-arc', 'torrent-beam', 'jolt-wave', 'splash-shot']],
  ['sparkit', 'tidecrest-isles', ['electric'], [45, 50, 40, 70, 50, 95], 'static-skin', ['static-jab', 'thunder-arc', 'quick-jab', 'jolt-wave']],
  ['tempestra', 'tidecrest-isles', ['electric', 'flying'], [85, 70, 75, 120, 85, 110], 'storm-call', ['storm-surge', 'cyclone', 'thunder-arc', 'updraft']],
  ['seadrak', 'tidecrest-isles', ['dragon', 'water'], [95, 110, 90, 90, 85, 85], 'tide-born', ['drake-claw', 'riptide-claw', 'wyrm-breath', 'scale-dance']],
  ['shellbash', 'tidecrest-isles', ['water', 'rock'], [70, 90, 120, 50, 70, 40], 'sturdy-shell', ['tide-slam', 'boulder-smash', 'plating', 'pebble-toss']],
  ['driftseal', 'tidecrest-isles', ['normal', 'water'], [100, 70, 70, 70, 80, 60], 'thick-blubber', ['crushing-blow', 'torrent-beam', 'second-wind', 'rime-ray']],
  ['coralyn', 'tidecrest-isles', ['water', 'fairy'], [75, 50, 80, 95, 105, 70], 'petal-veil', ['torrent-beam', 'lunar-glow', 'charm-veil', 'second-wind']],
  // Duskmarsh
  ['bogling', 'duskmarsh', ['poison', 'water'], [55, 55, 55, 55, 55, 45], 'spore-skin', ['venom-sting', 'splash-shot', 'miasma', 'bash']],
  ['mirelurk', 'duskmarsh', ['water', 'ground'], [110, 95, 85, 70, 75, 45], 'thick-blubber', ['tide-slam', 'quake-stomp', 'mudslide', 'second-wind']],
  ['hexmoth', 'duskmarsh', ['bug', 'ghost'], [60, 55, 60, 100, 80, 100], 'dust-wings', ['chitin-beam', 'phantom-wave', 'dread-gaze', 'haunt']],
  ['venomaw', 'duskmarsh', ['poison', 'dark'], [80, 110, 75, 65, 70, 95], 'night-hunter', ['blight-fang', 'shadow-maul', 'sneak-bite', 'battle-focus']],
  ['gloomshade', 'duskmarsh', ['ghost', 'dark'], [75, 65, 80, 115, 90, 90], 'cursed-chill', ['phantom-wave', 'night-pulse', 'sinister-plot', 'haunt']],
  ['creepvine', 'duskmarsh', ['grass', 'poison'], [65, 80, 70, 80, 70, 60], 'spore-skin', ['thorn-whip', 'toxic-spit', 'sap-drain', 'miasma']],
  ['ravenox', 'duskmarsh', ['dark', 'flying'], [70, 95, 60, 80, 60, 105], 'night-hunter', ['shadow-maul', 'sky-dive', 'sneak-bite', 'night-pulse']],
  ['wispet', 'duskmarsh', ['ghost'], [40, 40, 40, 65, 55, 70], 'cursed-chill', ['haunt', 'mind-pulse', 'dread-gaze', 'bash']],
  ['croakmire', 'duskmarsh', ['water', 'poison'], [90, 85, 90, 80, 80, 60], 'spore-skin', ['riptide-claw', 'blight-fang', 'mudslide', 'miasma']],
  ['morbelich', 'duskmarsh', ['ghost', 'poison'], [95, 70, 95, 125, 110, 70], 'cursed-chill', ['phantom-wave', 'toxic-spit', 'sinister-plot', 'night-pulse']],
  // Ironspire
  ['boltbot', 'ironspire', ['electric', 'steel'], [50, 55, 70, 65, 55, 60], 'static-skin', ['static-jab', 'iron-tap', 'thunder-arc', 'plating']],
  ['gearhulk', 'ironspire', ['steel'], [90, 115, 130, 50, 75, 40], 'cold-forge', ['alloy-slam', 'iron-knuckle', 'quake-stomp', 'plating']],
  ['mindroid', 'ironspire', ['psychic', 'steel'], [75, 60, 90, 115, 100, 75], 'aurora-mind', ['psy-lance', 'chrome-ray', 'focus-trance', 'thunder-arc']],
  ['punchron', 'ironspire', ['fighting', 'steel'], [85, 125, 95, 50, 70, 75], 'iron-will', ['iron-knuckle', 'alloy-slam', 'palm-strike', 'fighting-stance']],
  ['rooflet', 'ironspire', ['normal', 'flying'], [55, 60, 50, 45, 45, 80], 'dust-wings', ['bash', 'gust-cut', 'quick-jab', 'sky-dive']],
  ['neonlynx', 'ironspire', ['electric'], [65, 70, 60, 105, 75, 115], 'storm-call', ['thunder-arc', 'storm-surge', 'night-pulse', 'jolt-wave']],
  ['seraphyne', 'ironspire', ['fairy', 'psychic'], [80, 50, 75, 115, 115, 85], 'aurora-mind', ['lunar-glow', 'psy-lance', 'focus-trance', 'second-wind']],
  ['scrapcat', 'ironspire', ['normal', 'dark'], [60, 80, 55, 45, 55, 95], 'night-hunter', ['crushing-blow', 'sneak-bite', 'quick-jab', 'shadow-maul']],
  ['dojoka', 'ironspire', ['fighting'], [60, 85, 55, 35, 50, 65], 'iron-will', ['palm-strike', 'iron-knuckle', 'bash', 'fighting-stance']],
  ['voltitan', 'ironspire', ['electric', 'fighting'], [100, 120, 95, 90, 80, 85], 'storm-call', ['volt-lance', 'titan-kick', 'thunder-arc', 'fighting-stance']],
]

// ---------------------------------------------------------------------------
// Trainers. tier 1 = matches 1-3, tier 2 = matches 4-6, tier 3 = final.
// ---------------------------------------------------------------------------
export const TRAINERS = [
  ['pip', 'Pip', 'Bug Catcher', 1, 46, ['larvine', 'mothquill', 'sproutle', 'pixwing', 'featherwisp', 'hornvex']],
  ['rosa', 'Rosa', 'Ember Novice', 1, 46, ['cindrel', 'smoldrake', 'cragling', 'pyrrhound', 'scorchfist', 'sparkit']],
  ['finn', 'Finn', 'Island Kid', 1, 46, ['puddlit', 'sparkit', 'shellbash', 'gullstrike', 'driftseal', 'coralyn']],
  ['mira', 'Mira', 'Snow Scout', 1, 46, ['frostkit', 'drifmuff', 'chillshade', 'rimeowl', 'glacirn', 'brinewhal']],
  ['rook', 'Rook', 'Street Brawler', 1, 46, ['dojoka', 'scrapcat', 'rooflet', 'boltbot', 'punchron', 'venomaw']],
  ['selene', 'Selene', 'Marsh Witch', 2, 50, ['gloomshade', 'hexmoth', 'croakmire', 'creepvine', 'venomaw', 'morbelich']],
  ['brannoc', 'Brannoc', 'Volcano Warden', 2, 50, ['magmaw', 'basaltor', 'terrapyre', 'obsidjack', 'scorchfist', 'ashwyrm']],
  ['kael', 'Kael', 'Storm Rider', 2, 50, ['tempestra', 'voltfin', 'gullstrike', 'seadrak', 'reefjaw', 'neonlynx']],
  ['yuna', 'Yuna', 'Frost Sage', 2, 50, ['aurorym', 'wraithfrost', 'glacirn', 'tundrax', 'brinewhal', 'cryostag']],
  ['vex', 'Dr. Vex', 'Ironspire Engineer', 2, 50, ['gearhulk', 'mindroid', 'punchron', 'neonlynx', 'cryostag', 'hornvex']],
  ['aurelia', 'Aurelia', 'League Champion', 3, 53, ['seraphyne', 'ashwyrm', 'seadrak', 'morbelich', 'voltitan', 'tempestra']],
  ['orin', 'Orin', 'Grand Master', 3, 53, ['voltitan', 'aurorym', 'terrapyre', 'elkenwood', 'gloomshade', 'cryostag']],
]

export const TYPE_COLORS = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C', grass: '#7AC74C',
  ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65', flying: '#A98FF3',
  psychic: '#F95587', bug: '#A6B91A', rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC',
  dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD',
}
