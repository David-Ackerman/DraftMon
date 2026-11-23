# Draftmon

Draft a team of six Pokémon by region and type, then battle Gym Leaders, Elite Four members and Champions. A run ends after one loss or seven wins. The daily challenge uses the date as its seed.

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm start
```

Use Node.js 24 and the pnpm version pinned in the root package manifest. Run commands from the repository root. `pnpm dev` starts Next.js on port 3000 and the Hono API on port 4000. Next rewrites same-origin `/api/*` requests to the backend. The API uses a persistent PGlite database in `.poke-battle/postgres` by default.

- `apps/web` contains the Next.js App Router, public catalog pages, client game screens and Tailwind styles.
- `apps/api` contains typed Hono routes, authentication and the tournament deadline job.
- `packages/db` contains Drizzle migrations, Postgres repositories and their in-memory test implementation.
- `packages/engine` contains the pure game engine. It receives the catalog at runtime and imports only its types.
- `packages/content`, `packages/contracts` and `packages/config` contain the catalog, shared request schemas and TypeScript settings.

See the [HTTP contract](docs/api-contract.md) and [deployment and migration instructions](docs/deploy.md). Run `pnpm exec turbo run lint typecheck test build` to check the whole workspace.

## Play

1. Roll a region and a type. Catch one of the 10 Pokémon offered. Non-legendary Normal-type Pokémon fill open slots as wildcards. Each list can contain up to one Pokémon labeled Legendary, which includes Mythical Pokémon.
2. Use up to three rerolls per run to change the region, type, or both.
3. Before each match, inspect your opponent's team and reorder your six Pokémon.
4. Watch the automatic battle at 1×, 2× or 4×, or skip to the result.

Use the language list in the header to switch between English and Brazilian Portuguese, including Pokédex descriptions and move names and effects. The theme button remembers your light or dark mode preference. Hover over, focus, or tap a region or trainer to read about their games and generation. Each catch plays a shortened Pokémon Red and Blue capture fanfare. Legendary Pokémon use the Master Ball animation.

The Pokédex button in the header opens your battle collection. A species registers the first time it enters a completed battle, with one use counted per battle. Forms share a species entry, and a species is listed under the first matching region in debut release order. Hover over or tap an entry to inspect its stats and use count. Signed-in progress follows the account, and guest progress stays linked to the browser's guest ID. Older solo games did not save which Pokémon entered battle.

## Rooms and tournaments

Create or sign in to an account from the header to host a friends tournament. Share the invite link or code from **Rooms & tournaments**. Guests can join without an account as long as they have the invitation. A room can include up to 16 participants, including up to eight optional bots.

Each participant drafts privately. When creating a tournament, the host sets the time allowed to finish the draft and to submit a lineup in each round. The default is 10 minutes. The server advances early when everyone is ready. At the draft deadline, the server fills each open slot by randomly catching a Pokémon from the player's current offer, then rolls a fresh offer for the next slot. At a round deadline, it shuffles the battle order of each matched player who has yet to submit a lineup, then runs the battles. Bots are always ready.

The optional group stage pairs each eligible participant once, with the top half (at least two) advancing by wins. Ties use participant order. The knockout stage advances winners automatically and assigns a bye to the unpaired player. Players can replay their own matches and spectate finished matches against bots. Replays contain the Pokémon revealed in battle, and other players' draft choices are private.

Run `pnpm build` and `pnpm start` to preview both production builds. For LAN testing, run `pnpm --filter @draftmon/api dev` and `pnpm --filter @draftmon/web dev --hostname 0.0.0.0` in separate terminals. Open the Next.js LAN address before copying the invite.

## Accounts and password recovery

The header's account menu links to the registration and recovery pages. New accounts require an email address. Existing players can add or change it from the same menu using their current password. Reset links expire after 30 minutes, work once and revoke the account's sessions when used.

Configure the following environment variables on the Node server to enable email delivery:

- `RESEND_API_KEY` from [Resend](https://resend.com/docs/api-reference/emails/send-email).
- `POKE_BATTLE_MAIL_FROM` with an authorized sender, such as `Draftmon <conta@example.com>`.
- `PUBLIC_APP_URL` with the public HTTPS address of Draftmon.

## Web advertisements

Draftmon uses AdSense [Auto ads](https://support.google.com/adsense/answer/9261805). The site loads the AdSense script once on every page and reserves no ad space; Google chooses placements and formats.

The publisher ID is set in `apps/web/src/components/layout/Ads.tsx` (`ADSENSE_CLIENT`). Every page also carries the `google-adsense-account` meta tag so AdSense can verify the site. Keep `apps/web/public/ads.txt` in sync with that ID.

In AdSense, verify the production domain and turn on Auto ads for the site. Choose formats and exclude pages (for example `/account/*` to keep account pages ad-free) under the site's Auto ads settings. Development mode makes zero ad requests.

## In-game bug reports

Set `DRAFTMON_GITHUB_REPOSITORY=owner/repo` and `DRAFTMON_GITHUB_TOKEN` on the Node service to enable issue creation. Enable Issues for that repository, and use a fine-grained personal access token restricted to it with **Issues: Read and write**. Keep the token on the server, outside Git and outside public build-time variables. [GitHub Issues API](https://docs.github.com/en/rest/issues/issues#create-an-issue)

Set `PUBLIC_APP_URL` to the public HTTPS address to accept screenshots. The game previews the visible play area before submission and excludes the tournament invite fields. Account and password pages accept text reports only. Each screenshot is stored in `POKE_BATTLE_SCREENSHOT_DIRECTORY` and linked from its issue. The default directory is `.poke-battle/bug-screenshots`. Anyone with that link can open the screenshot, so it becomes public if the issue is public. Copy this folder separately if you migrate the server or back it up to retain existing links.

## Back up and restore

See the [backup and restore instructions](docs/deploy.md#backup-and-restore). The automated suite imports legacy data and verifies a restore into a fresh PGlite directory.

## Catalog and assets

The game ships with a local snapshot of the [PokéAPI](https://pokeapi.co/docs/v2#pokemon). It includes the default form of every listed species and seven additional Hisuian forms. Regional Pokédexes are combined across the listed games. Species absent from all regional Pokédexes are assigned to their generation's debut region. The player Pokédex counts each species once, and Pokémon with no compatible attack use Struggle.

`pnpm content` regenerates the snapshot using Node.js and FFmpeg with WebP support. It reads from `.pokeapi-cache/`, writes catalog data to `packages/content/data` and reuses assets in `apps/web/public`. Run `pnpm content --refresh` to fetch fresh data and artwork. The browser serves the bundled assets locally during play.

- `scripts/content.mjs` defines the additional forms, compatible moves and opponents. The 12 trainers' teams are adapted for six-on-six battles. `packages/content/data/pokedex-pt-br.json` provides locally bundled translations. Entries without a Portuguese description display their National Pokédex number.
- Pokémon artwork and cries come from [PokéAPI Sprites](https://github.com/PokeAPI/sprites) and [PokéAPI Cries](https://github.com/PokeAPI/cries).
- Trainer portraits come from the [Pokémon Showdown trainer archive](https://play.pokemonshowdown.com/sprites/trainers/).
- Region art comes from the [Pokémon Center map posters](https://www.pokemoncenter.com/en-gb/product/710-97604/pokemon-region-maps-posters-9-pack) and the [Pokémon Legends: Arceus story page](https://legends.arceus.pokemon.com/en-us/story/).
- The capture, victory and badge fanfares come from the [ENLS Red & Blue + Yellow archive](https://enls.eu/prelooped/album/?game=RBY). Menu and battle effects were rendered from the Pokémon Red [PokeSwift audio manifest](https://github.com/Dimillian/PokeSwift/blob/main/Content/Red/audio_manifest.json).
- Background music is [Simple menu/background music loop](https://opengameart.org/content/simple-menubackground-music-loop) by polosik, released under CC0. Draftmon includes a compressed, level-adjusted copy.

## Battle mechanics

The simulator uses level-based stats, all 18 types, dual-type effectiveness, same-type attack bonus, physical and special attacks, accuracy, critical hits, priority, stat stages, healing, drain and major status effects. Its move pool is curated for the supported mechanics. Abilities, held items and voluntary switching are outside the simulator.

## License

The original Draftmon source code is available under the [MIT License](LICENSE). Third-party assets, including Pokémon artwork, characters, sounds and trademarks, remain subject to their respective rights and terms. See [Catalog and assets](#catalog-and-assets) for the source credits.
