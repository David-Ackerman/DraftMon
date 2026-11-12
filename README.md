# Draft League

A browser draft-and-battle game: roll creatures by **region + type**, build a team of 6,
then fight through a 7-match league of rival trainers. One loss ends the run. Inspired by
the draft loop of [7a0](https://7a0.com.br/en).

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # engine tests (type chart, battles, draft, league, balance sim)
pnpm build
```

## How a run works

1. **Draft:** each roll shows 3 creatures from one region and type. You have 3 rerolls per run:
   - **↻ Type** keeps the region and rolls a new type
   - **↻ Region** keeps the type and rolls a new region
   - **↻ Both** rolls both
   If a region + type combo has fewer than 3 creatures, the extra slots are "wildcards" from the same region.
2. **League:** 3 group matches against tier-1 trainers, 3 knockout matches against tier-2, and a final against a tier-3 champion. Trainers are drawn at random each run and shuffle their order every match.
3. **Prep:** before each match you see the opponent's 6 creatures and can reorder your team.
4. **Battle:** fully automatic, replayed turn by turn (1×/2×/4×/skip).

The **daily challenge** uses a seed based on the date, so everyone gets the same first roll and bracket that day.

## Battle engine (`src/engine/battle.ts`)

- Main-series stat formula (level 50 player; trainers: tier 1 = Lv46, tier 2 = Lv50, champion = Lv53)
- All 18 types with the full effectiveness chart, dual-type multipliers and 1.5× same-type bonus
- Physical/special split, accuracy, priority, critical hits, random damage roll
- Stat stages, drain, healing
- Burn, poison, paralysis, sleep and freeze
- AI picks the move with the best expected value: KOs, type advantage, status, boosts, healing
- **Not yet:** abilities (stored in data but not applied), held items, voluntary switching

## Data files: PokeAPI shape

All content lives in `src/data/` and follows the [PokeAPI v2](https://pokeapi.co/docs/v2) resource
shapes, so you can replace the files with other PokeAPI-shaped data without changing the engine.

| File | Shape | Used fields |
|---|---|---|
| `pokemon.json` | array of `/pokemon/{id}` | `name`, `species.name`, `types[].slot/type.name`, `stats[].base_stat/stat.name`, `abilities`, `moves[].move.name`, `sprites.front_default`, `sprites.other["official-artwork"].front_default` |
| `moves.json` | array of `/move/{id}` | `name`, `power`, `accuracy`, `priority`, `damage_class.name`, `type.name`, `target.name`, `meta.{ailment, ailment_chance, category, crit_rate, drain, healing, stat_chance}`, `stat_changes`, `effect_entries` |
| `types.json` | array of `/type/{id}` | `name`, `damage_relations.{double,half,no}_damage_to` |
| `regions.json` | array of `/pokedex/{id}` | `name`, `names[]`, `descriptions[]`, `pokemon_entries[].pokemon_species.name` |
| `trainers.json` | game-specific (PokeAPI has no trainers) | `id`, `name`, `title`, `tier` (1–3), `level`, `sprite`, `pokemon[].name`, optional `pokemon[].moves` |

Notes for swapping data:
- A creature's region comes from the pokedex files, matched by `species.name`.
- If a creature lists more than 4 moves (for example a full learnset), the engine picks 4 automatically: the best attack of each of its own types, coverage attacks, then one status move. Only moves that exist in `moves.json` are considered.
- Sprite paths can be local (`/sprites/x.png` in `public/`) or full URLs.

The bundled original content is generated from `scripts/content.mjs` by `pnpm content`, which rewrites `src/data/*.json`, `public/sprites/*.svg` and `public/trainers/*.svg`.
