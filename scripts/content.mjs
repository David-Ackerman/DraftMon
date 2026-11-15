export const pokemon = `
bulbasaur venusaur charmander charizard squirtle blastoise butterfree pidgeot pikachu raichu
nidoking clefable ninetales golbat vileplume alakazam machamp tentacruel golem rapidash slowbro
magneton gengar hypno marowak hitmonlee hitmonchan weezing rhydon starmie scyther electabuzz magmar
pinsir tauros gyarados lapras eevee vaporeon jolteon flareon aerodactyl snorlax dragonite
meganium typhlosion feraligatr noctowl ariados lanturn xatu ampharos azumarill sudowoodo
politoed espeon umbreon slowking misdreavus girafarig forretress steelix granbull scizor
heracross ursaring skarmory houndoom kingdra donphan porygon2 miltank tyranitar
sceptile blaziken swampert ludicolo shiftry gardevoir breloom slaking exploud hariyama aggron
manectric roselia flygon altaria zangoose seviper lunatone solrock whiscash crawdaunt
claydol armaldo milotic castform banette dusclops absol glalie walrein salamence metagross
torterra infernape empoleon staraptor luxray roserade rampardos bastiodon floatzel gastrodon
drifblim lopunny mismagius honchkrow spiritomb garchomp lucario hippowdon drapion toxicroak
abomasnow weavile magnezone rhyperior electivire magmortar togekiss leafeon glaceon gallade froslass
serperior emboar samurott stoutland zebstrika gigalith excadrill scolipede whimsicott krookodile
darmanitan-standard cofagrigus archeops zoroark cinccino gothitelle reuniclus vanilluxe
sawsbuck galvantula ferrothorn chandelure haxorus beartic mienshao bisharp braviary mandibuzz hydreigon volcarona
chesnaught delphox greninja talonflame vivillon florges gogoat pangoro aegislash-shield
aromatisse slurpuff malamar barbaracle dragalge clawitzer heliolisk tyrantrum aurorus
sylveon hawlucha dedenne goodra klefki trevenant avalugg noivern
decidueye incineroar primarina toucannon vikavolt ribombee lycanroc-midday toxapex mudsdale
araquanid lurantis salazzle bewear comfey oranguru passimian golisopod palossand turtonator
togedemaru mimikyu-disguised drampa kommo-o
rillaboom cinderace inteleon corviknight orbeetle drednaw coalossal flapple appletun sandaconda
toxtricity-amped centiskorch grapploct polteageist hatterene grimmsnarl alcremie falinks
frosmoth copperajah duraludon dragapult
decidueye-hisui typhlosion-hisui samurott-hisui arcanine-hisui electrode-hisui zoroark-hisui
sneasler overqwil lilligant-hisui basculegion-male kleavor ursaluna wyrdeer
meowscarada skeledirge quaquaval lokix pawmot dachsbun arboliva garganacl armarouge ceruledge
bellibolt kilowattrel mabosstiff grafaiai toedscruel scovillain espathra tinkaton
bombirdier palafin-zero revavroom cyclizar glimmora greavard houndstone flamigo cetitan
veluza dondozo tatsugiri-curly annihilape clodsire farigiraf kingambit baxcalibur
articuno zapdos moltres mewtwo mew raikou entei suicune lugia ho-oh celebi
regirock regice registeel latias latios jirachi cresselia heatran victini virizion
zygarde-50 diancie silvally tapu-koko tapu-fini zacian zamazenta kubfu wo-chien chien-pao
`.trim().split(/\s+/)

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
