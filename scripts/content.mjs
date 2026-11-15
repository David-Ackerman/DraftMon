// Additional playable forms kept for existing teams and saved replays.
export const additionalForms = [
  'decidueye-hisui', 'typhlosion-hisui', 'samurott-hisui', 'arcanine-hisui',
  'electrode-hisui', 'zoroark-hisui', 'lilligant-hisui',
]

export const supportedMoves = `
tackle scratch pound quick-attack slash body-slam strength headbutt hyper-voice hyper-fang
tri-attack extreme-speed facade swift take-down double-edge mega-kick
ember flame-wheel flamethrower flame-burst fire-blast fire-punch fire-fang heat-wave
flare-blitz lava-plume mystical-fire fire-lash pyro-ball torch-song
water-gun bubble-beam water-pulse surf hydro-pump liquidation waterfall aqua-jet aqua-tail scald
razor-leaf leafage magical-leaf giga-drain energy-ball seed-bomb leaf-blade power-whip
synthesis wood-hammer horn-leech drum-beating
thunder-shock spark discharge thunderbolt thunder thunder-punch thunder-fang wild-charge shock-wave
ice-shard icy-wind ice-fang aurora-beam ice-beam ice-punch blizzard ice-spinner
karate-chop brick-break low-sweep force-palm drain-punch close-combat cross-chop aura-sphere
submission focus-blast mach-punch superpower hammer-arm sacred-sword
poison-sting acid sludge sludge-bomb sludge-wave poison-jab poison-fang cross-poison gunk-shot
mud-slap mud-shot mud-bomb bulldoze magnitude earth-power earthquake stomping-tantrum drill-run
gust wing-attack air-cutter air-slash aerial-ace drill-peck brave-bird acrobatics hurricane
confusion psybeam psychic zen-headbutt psycho-cut extrasensory
bug-bite pounce signal-beam struggle-bug x-scissor lunge bug-buzz leech-life
rock-throw ancient-power rock-tomb power-gem rock-slide stone-edge rock-blast
lick astonish shadow-sneak shadow-claw shadow-ball shadow-punch hex phantom-force bitter-malice
twister dragon-breath dragon-pulse dragon-claw dragon-rush draco-meteor breaking-swipe
bite crunch knock-off night-slash dark-pulse sucker-punch throat-chop snarl payback ceaseless-edge
metal-claw bullet-punch magnet-bomb mirror-shot flash-cannon iron-head iron-tail steel-wing
fairy-wind draining-kiss disarming-voice dazzling-gleam moonblast play-rough spirit-break
swords-dance nasty-plot bulk-up calm-mind dragon-dance quiver-dance coil iron-defense
rock-polish agility amnesia howl growth tail-glow withdraw defense-curl
recover roost soft-boiled slack-off milk-drink shore-up
thunder-wave stun-spore glare will-o-wisp toxic poison-powder sleep-powder hypnosis spore yawn
`.trim().split(/\s+/)

// Teams adapted to the league's six-slot format. Portrait names match Showdown's archive.
export const trainers = [
  { id: 'brock', name: 'Brock', title: 'Pewter Gym Leader', tier: 1, portrait: 'brock', team: 'golem sudowoodo rampardos armaldo steelix aerodactyl' },
  { id: 'misty', name: 'Misty', title: 'Cerulean Gym Leader', tier: 1, portrait: 'misty', team: 'starmie slowbro golduck lanturn azumarill dewgong' },
  { id: 'lt-surge', name: 'Lt. Surge', title: 'Vermilion Gym Leader', tier: 1, portrait: 'ltsurge', team: 'raichu electrode magneton electabuzz manectric ampharos' },
  { id: 'erika', name: 'Erika', title: 'Celadon Gym Leader', tier: 1, portrait: 'erika', team: 'vileplume tangela victreebel bellossom jumpluff leafeon' },
  { id: 'blaine', name: 'Blaine', title: 'Cinnabar Gym Leader', tier: 1, portrait: 'blaine', team: 'rapidash magmar flareon ninetales arcanine magcargo' },
  { id: 'lorelei', name: 'Lorelei', title: 'Kanto Elite Four', tier: 2, portrait: 'lorelei-gen3', team: 'lapras jynx cloyster dewgong slowbro glaceon' },
  { id: 'agatha', name: 'Agatha', title: 'Kanto Elite Four', tier: 2, portrait: 'agatha-gen3', team: 'gengar arbok golbat weezing misdreavus haunter' },
  { id: 'bruno', name: 'Bruno', title: 'Kanto Elite Four', tier: 2, portrait: 'bruno', team: 'machamp hitmonlee hitmonchan hitmontop steelix hariyama' },
  { id: 'karen', name: 'Karen', title: 'Johto Elite Four', tier: 2, portrait: 'karen', team: 'umbreon houndoom murkrow vileplume gengar weavile' },
  { id: 'lance', name: 'Lance', title: 'Indigo League Champion', tier: 3, portrait: 'lance', team: 'dragonite gyarados aerodactyl charizard kingdra salamence' },
  { id: 'steven', name: 'Steven', title: 'Hoenn Champion', tier: 3, portrait: 'steven-gen3', team: 'metagross skarmory claydol aggron cradily armaldo' },
  { id: 'cynthia', name: 'Cynthia', title: 'Sinnoh Champion', tier: 3, portrait: 'cynthia-gen4', team: 'garchomp spiritomb roserade gastrodon lucario milotic' },
]
