# Draftmon

Draft a team of six Pokémon by region and type, then battle Gym Leaders, Elite Four members and Champions. A run ends after one loss or seven wins. The daily challenge uses the date as its seed.

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm start
```

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

Run `pnpm build` and `pnpm start` to serve the app and API together. Participants must reach the same server. For LAN testing, run `pnpm dev --host 0.0.0.0` and use the server's LAN address before copying the invite. For an HTTPS deployment behind a reverse proxy, set `HOST=0.0.0.0`, the required `PORT`, and `POKE_BATTLE_SECURE_COOKIES=1`. Run a single instance with persistent storage for `.poke-battle/` (or set `POKE_BATTLE_ROOMS_FILE` and `POKE_BATTLE_ACCOUNTS_FILE`). Static hosting of `dist/` serves the solo game only.

## Deploy on Google Cloud

1. [Create one Compute Engine VM](https://docs.cloud.google.com/compute/docs/instances/create-start-instance) with Ubuntu and a persistent boot disk. An E2 shared-core VM is a starting point for a small pilot. Check the region, IPv4, disk and traffic costs and your [credit balance and expiry](https://docs.cloud.google.com/billing/docs/how-to/resolve-issues#view-promotional-credits-applied-to-your-account) before publishing.
2. Connect via SSH, install a supported Node.js LTS release and pnpm, then copy the project to the VM or clone it from your own Git remote. Run `pnpm install --frozen-lockfile` and `pnpm build` in the project directory. Set the public `VITE_ADSENSE_*` variables before building if you are enabling ads.
3. Run `node scripts/server.mjs` as an unprivileged account under a systemd service with restart on failure. Use the project directory as `WorkingDirectory`. Create a writable directory on the persistent disk for the app data and set:

   ```dotenv
   HOST=127.0.0.1
   PORT=4173
   POKE_BATTLE_ROOMS_FILE=/var/lib/draftmon/rooms.json
   POKE_BATTLE_ACCOUNTS_FILE=/var/lib/draftmon/accounts.json
   POKE_BATTLE_SECURE_COOKIES=1
   PUBLIC_APP_URL=https://play.example.com
   ```

   The Pokédex is saved next to `rooms.json`. Keep the data directory separate from the code directory and include it in your backup plan. Set the Resend variables on the service if you want password recovery.
4. Reserve a [static external IPv4](https://docs.cloud.google.com/compute/docs/ip-addresses/configure-static-external-ip-address) and point your hostname's DNS `A` record to it. Allow inbound TCP ports 80 and 443 and configure a [Caddy reverse proxy](https://caddyserver.com/docs/quick-starts/reverse-proxy) with automatic HTTPS:

   ```caddy
   play.example.com {
       reverse_proxy 127.0.0.1:4173
   }
   ```

5. On the HTTPS URL, test signing in and joining a tournament from another browser. Restart the service and confirm that the account and tournament are still present. Test password recovery if the mail provider is configured.

## Accounts and password recovery

The header's account menu links to the registration and recovery pages. New accounts require an email address. Existing players can add or change it from the same menu using their current password. Reset links expire after 30 minutes, work once and revoke the account's sessions when used.

Configure the following environment variables on the Node server to enable email delivery:

- `RESEND_API_KEY` from [Resend](https://resend.com/docs/api-reference/emails/send-email).
- `POKE_BATTLE_MAIL_FROM` with an authorized sender, such as `Draftmon <conta@example.com>`.
- `PUBLIC_APP_URL` with the public HTTPS address of Draftmon.

## Web advertisements

Draftmon uses three manual display units outside the game controls. The bottom banner sits below the game on all devices. The side units appear at widths of 1366px and above on devices with a fine pointer. Account pages are ad-free.

Create [display ad units](https://support.google.com/adsense/answer/9274025) in AdSense and set these public build-time variables before running `pnpm build`:

- `VITE_ADSENSE_CLIENT` with your publisher ID, including the `ca-pub-` prefix.
- `VITE_ADSENSE_LEFT_SLOT`, `VITE_ADSENSE_RIGHT_SLOT` and `VITE_ADSENSE_BOTTOM_SLOT` with the corresponding numeric ad slot IDs.

Use AdSense's site setup to verify the production domain and publish its `ads.txt` entry at the web root. Keep Auto ads off if you want only the three manual placements. Development mode displays placeholders and makes zero ad requests. Production skips each slot that has no configured ID.

## In-game bug reports

Set `DRAFTMON_GITHUB_REPOSITORY=owner/repo` and `DRAFTMON_GITHUB_TOKEN` on the Node service to enable issue creation. Enable Issues for that repository, and use a fine-grained personal access token restricted to it with **Issues: Read and write**. Keep the token on the server, outside Git and outside the `VITE_*` variables. [GitHub Issues API](https://docs.github.com/en/rest/issues/issues#create-an-issue)

Set `PUBLIC_APP_URL` to the public HTTPS address to accept screenshots. The game previews the visible play area before submission and excludes the tournament invite fields. Account and password pages accept text reports only. Each screenshot is stored in `bug-screenshots/` alongside `rooms.json` and linked from its issue. Anyone with that link can open the screenshot, so it becomes public if the issue is public. Copy this folder separately if you migrate the server or back it up to retain existing links.

## Back up and restore

Stop the server before taking a backup so the account, room and Pokédex files represent the same point in time. Use a private destination outside the web root whose filesystem supports hard links.

```bash
pnpm backup /private-backups/draftmon-2026-11-14.json
pnpm restore /private-backups/draftmon-2026-11-14.json
```

Before restoring, point `POKE_BATTLE_ROOMS_FILE` and `POKE_BATTLE_ACCOUNTS_FILE` to empty destination paths. The Pokédex file is restored alongside the rooms file. The restore checks the archive's checksums, refuses to overwrite existing files and invalidates active sessions and password reset links. Start the server with the same paths to verify the restored data. Keep dated copies on separate storage and restrict access because the archive contains email addresses and password hashes.

## Catalog and assets

The game ships with a local snapshot of the [PokéAPI](https://pokeapi.co/docs/v2#pokemon). It includes 332 Pokémon with stats, types, artwork, cries and supported moves. Legendary and Mythical labels come from the species endpoint. The ten draft regions come from the API's region resources and their associated Pokédexes. A species can appear in more than one region's Pokédex.

`pnpm content` regenerates the snapshot using Node.js 20+ and FFmpeg with WebP support. It reads from `.pokeapi-cache/` and reuses downloaded assets. Run `pnpm content --refresh` to fetch fresh data and artwork. The browser serves the bundled assets locally during play.

- `scripts/content.mjs` defines the selection of Pokémon, compatible moves and opponents. The 12 trainers' teams are adapted for six-on-six battles. `src/data/pokedex-pt-br.json` provides locally bundled translations where PokéAPI has no Portuguese text.
- Pokémon artwork and cries come from [PokéAPI Sprites](https://github.com/PokeAPI/sprites) and [PokéAPI Cries](https://github.com/PokeAPI/cries).
- Trainer portraits come from the [Pokémon Showdown trainer archive](https://play.pokemonshowdown.com/sprites/trainers/).
- Region art comes from the [Pokémon Center map posters](https://www.pokemoncenter.com/en-gb/product/710-97604/pokemon-region-maps-posters-9-pack) and the [Pokémon Legends: Arceus story page](https://legends.arceus.pokemon.com/en-us/story/).
- The capture, victory and badge fanfares come from the [ENLS Red & Blue + Yellow archive](https://enls.eu/prelooped/album/?game=RBY). Menu and battle effects were rendered from the Pokémon Red [PokeSwift audio manifest](https://github.com/Dimillian/PokeSwift/blob/main/Content/Red/audio_manifest.json).
- Background music is [Simple menu/background music loop](https://opengameart.org/content/simple-menubackground-music-loop) by polosik, released under CC0. Draftmon includes a compressed, level-adjusted copy.

## Battle mechanics

The simulator uses level-based stats, all 18 types, dual-type effectiveness, same-type attack bonus, physical and special attacks, accuracy, critical hits, priority, stat stages, healing, drain and major status effects. Its move pool is curated for the supported mechanics. Abilities, held items and voluntary switching are outside the simulator.
