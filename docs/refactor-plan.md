# Draftmon refactor plan: Turborepo, Next.js, API, Postgres, Tailwind

The plan works with any PokeAPI-shaped content. Each phase leaves the game working and can be merged on its own, so `main` is never half-migrated.

**Decisions**

| Topic | Choice |
|---|---|
| Repository | Turborepo monorepo (pnpm workspaces) |
| Web | Next.js (App Router) + Tailwind v4, deployed to Vercel |
| API | Node + TypeScript (Hono or Fastify), deployed to Render, Fly or Railway |
| Storage | Postgres (Neon or Supabase) via Drizzle; PGlite locally |
| Styling | Tailwind utilities only; one global stylesheet |
| Visuals | Keep the current look; small consistency fixes allowed |

---

## Target structure

```
draftmon/
├─ apps/
│  ├─ web/              Next.js (App Router) + Tailwind v4 → Vercel
│  └─ api/              Node + TypeScript (Hono or Fastify) → Render/Fly/Railway
├─ packages/
│  ├─ engine/           battle, draft, tournament, type chart, rng (pure TS, no React, no I/O)
│  ├─ content/          data JSON + loaders/validators (PokeAPI shape)
│  ├─ db/               Drizzle schema, migrations, repositories (Postgres)
│  └─ config/           shared tsconfig, eslint, tailwind tokens
├─ turbo.json
└─ pnpm-workspace.yaml
```

### Dependency rules

Enforce these with ESLint `no-restricted-imports` or `eslint-plugin-boundaries`:

- `engine` imports nothing from the repo except `content` types.
- `api` may import `engine`, `content` and `db`.
- `web` may import `engine` and `content`. It talks to the API **only** through an API client. It never imports `db`.

---

## Phase 0: Baseline (half a day)

1. Create a branch: `git switch -c refactor/monorepo`.
2. Make sure `pnpm test` and `pnpm build` pass. Screenshot every screen; these are the visual reference for the Tailwind work.
3. List every API route in `scripts/lobby.mjs`, `accounts.mjs` and `tournament.mjs`, with method, path, body and response. This list becomes the API contract.

**Done when:** you have a green baseline, the screenshots and the route list.

---

## Phase 1: Turborepo plus the engine package (1 day)

1. Add `turbo` at the root and set `pnpm-workspace.yaml` to:
   ```yaml
   packages:
     - "apps/*"
     - "packages/*"
   ```
2. In `turbo.json`, define pipelines for `build`, `dev`, `test`, `lint` and `typecheck`. `build` depends on `^build`.
3. Move `src/engine/**` into `packages/engine/src`, and `src/data/**` plus the loaders into `packages/content`. Export a small public API from each `index.ts`.
4. For now, move the current Vite app to `apps/web` unchanged and point it at `@draftmon/engine`.
5. Move the engine tests along with the engine, and run them with `turbo test`.

**Done when:** the game runs exactly as before but imports the engine as a package.

---

## Phase 2: The API app (1–2 days)

1. Create `apps/api` and port `scripts/lobby.mjs`, `accounts.mjs`, `tournament.mjs` and `bug-reports.mjs` to TypeScript route modules, one file per resource: `routes/lobbies.ts`, `routes/accounts.ts` and so on.
2. The API imports `@draftmon/engine` directly. **Delete the `vite build --ssr src/engine/tournament.ts` step and the `dist-server` folder.** That workaround exists only because the engine wasn't a package.
3. Validate every request body with zod schemas. Put them in `packages/engine/src/contracts` or a small `packages/contracts`, so web and API share the types.
4. Move the `setInterval(expire)` loop into an `api/src/jobs/` module started by `main.ts`.
5. In dev, use a Vite proxy (`/api → localhost:4000`) until Phase 5.

**Done when:** the Vite middleware plugin is gone from `vite.config.ts`, and lobbies and accounts work through `apps/api`.

---

## Phase 3: Postgres behind repositories (1–2 days)

1. Create `packages/db` with Drizzle ORM. Write tables for `accounts`, `sessions`, `lobbies`, `lobby_members`, `tournaments`, `tournament_matches` and `bug_reports`. Use JSONB columns for snapshots of the battle or draft state rather than normalizing everything.
2. Define one **interface per resource**, so each route depends only on what it uses:
   ```ts
   interface LobbyRepository {
     create(lobby: NewLobby): Promise<Lobby>
     findByCode(code: string): Promise<Lobby | null>
     update(lobby: Lobby): Promise<void>
     expireOlderThan(date: Date): Promise<number>
   }
   ```
3. Write two implementations: `postgres/` (Drizzle) and `memory/` (for tests). Routes receive repositories through a `createApp({ repos })` factory; this is the dependency inversion step.
4. For local dev, use **PGlite** (Postgres in WASM, no Docker), selected when `DATABASE_URL` is unset. In production, use Neon or Supabase through `DATABASE_URL`.
5. Write a one-time script `api/scripts/import-json.ts` that loads the existing JSON files into Postgres. Replace `backup.mjs` with `pg_dump` or the provider's backups.
6. Move password hashing (argon2 or bcrypt) and session tokens into an `auth/` module. Store sessions in the database, not in memory.

**Done when:** `scripts/storage-paths.mjs`, `http-store.mjs` and `backup.mjs` are deleted, and the tests run against the in-memory repositories.

---

## Phase 4: Tailwind-only styling, still in Vite (2–3 days)

Do this **before** moving to Next.js, so that move is a straight copy of components.

### 4.1 One global stylesheet

`apps/web/src/app/globals.css` contains only:

- `@import "tailwindcss";`
- `@theme { … }` design tokens: colors (`--color-panel`, `--color-accent` …), radius, fonts, shadows, and animations (`--animate-card-in`, `--animate-reel-in`, `--animate-shuffle` …) with their `@keyframes`
- the dark theme variables under `[data-theme="dark"]`
- truly global base rules: body background, custom cursors, `prefers-reduced-motion`

### 4.2 Variants without CSS files

Add `clsx` + `tailwind-merge` (a `cn()` helper). For components with variants (Button, Card, TypeBadge, HudTag), use `class-variance-authority`:

```ts
const button = cva('inline-flex items-center gap-2 rounded-lg font-semibold transition', {
  variants: {
    tone: {
      primary: 'bg-accent text-accent-ink',
      ghost: 'bg-panel-muted border border-line',
    },
    size: {
      md: 'px-3.5 py-2',
      lg: 'px-5 py-3 text-lg',
    },
  },
  defaultVariants: { tone: 'ghost', size: 'md' },
})
```

### 4.3 Conversion order

Convert shared building blocks first, so later files mostly reuse them:

1. `components/ui`: Button, Card, HudTag
2. `components/pokemon` (`presentation.css`): TypeBadge, StatBars, MoveChip, Tooltip, CreatureCard
3. `components/layout` (`layout.css`)
4. `components/draft` (`draft.css`): the reels, card backs and roll button
5. `components/battle` (`battle.css`)
6. pages: `home.css`, `prep.css`, `results.css`, `pokedex.css`, `lobby.css`
7. `styles/presentation.css`, then `styles/cursors.css`, which goes into globals

For each file:

1. Convert its classes to utilities.
2. **Delete the `.css` file and its `@import`.**
3. Compare against the Phase 0 screenshots.

### 4.4 Rules

- Dynamic colors, like type colors, use a CSS variable plus an arbitrary value, not generated class names:
  ```tsx
  <span style={{ '--type': color } as React.CSSProperties} className="bg-(--type)" />
  ```
- Guard rails:
  - an ESLint rule blocking `.css` imports anywhere except `globals.css`
  - `prettier-plugin-tailwindcss` for class ordering
- When a class list repeats in 3 or more places, turn it into a component, not an `@apply`.

**Done when:** `git ls-files '*.css'` lists only `globals.css`.

---

## Phase 5: Next.js web app (2–3 days)

1. Create `apps/web` with `create-next-app` (TypeScript, App Router, Tailwind v4), then copy in `globals.css` and the converted components.
2. Routes:

   | Kind | Routes |
   |---|---|
   | Server-rendered (SEO) | `/` (landing), `/pokedex`, `/pokedex/[name]` with `generateStaticParams` from `@draftmon/content`, `/regions/[name]`, `/how-to-play` |
   | Client game screens | `/play` (solo run), `/lobby/[code]`, `/tournament/[id]`, `/account/*` |

   Each game page is a thin server component that renders one `"use client"` component.
3. Put `"use client"` only on interactive leaves: the draft, battle, audio, sound service, hooks, and anything touching `localStorage`, `window` or audio. Keep shared presentational components (cards, badges, stat bars) usable from both server and client components.
4. SEO:
   - `generateMetadata` on every public page (title, description, Open Graph image)
   - `app/sitemap.ts` and `app/robots.ts`
   - JSON-LD on creature pages
   - `next/image` for sprites, with `images.remotePatterns` if any are remote
5. Reach the API through **Next rewrites**:
   ```ts
   // next.config.ts
   async rewrites() {
     return [{ source: '/api/:path*', destination: `${process.env.API_URL}/:path*` }]
   }
   ```
   The browser then only talks to your own domain: cookies stay first-party and the page needs no CORS.
6. Replace the hand-rolled routing in `App.tsx` with real routes. The solo run state (`useSoloRun`) stays a client hook, and can later be persisted through the API.
7. Delete Vite from `apps/web`, along with `index.html` and `vite.config.ts`.

**Done when:** `turbo build` produces a Next build, every screen matches the screenshots, and Lighthouse SEO scores at least 90 on the public pages.

---

## Phase 6: Engine readability pass (1 day, can run in parallel with Phase 4)

The engine is already split into 9 files. What's left is making each function read like a sentence and making additions not require edits.

- **Separate deciding from resolving:**
  - `move-selection.ts` only scores and picks.
  - `perform-move.ts` only applies.
  - `simulate.ts` only orchestrates turns: choose, then order, then act, then end-of-turn effects, then replace fainted creatures.
- **Scorer registry for the AI (open/closed):**
  ```ts
  type MoveScorer = (ctx: ScoringContext, move: Move) => number | null
  const scorers: MoveScorer[] = [damageScorer, ailmentScorer, healScorer, statChangeScorer]
  ```
  A new move category means a new scorer and no edits to the chooser.
- **Effect handlers by category:** `handlers[move.meta.category]` (`damage`, `damage+ailment`, `heal`, `net-good-stats` …), each a small function of type `(ctx, move) => BattleEvent[]`.
- **Return events instead of pushing to a shared array.** Functions like `applyStatus` return the events they caused and the simulator collects them. This makes them pure and testable one at a time.
- **Names that describe the outcome:**

  | Current | New |
  |---|---|
  | `canAfflict` | `isImmuneToAilment` (inverted) |
  | `beforeMove` | `checkCanAct` |
  | `residual` | `applyEndOfTurnDamage` |

- **Tests:** one test file per module, with a table-driven test for the type chart and a small battle-builder helper so tests stay short:
  ```ts
  givenBattle().withAttacker('x').withDefender('y').run()
  ```

---

## Phase 7: Deploy and CI (half a day)

| Piece | Setup |
|---|---|
| Web | Vercel project with root `apps/web`. Turborepo is detected automatically and remote caching is free. Env: `API_URL` |
| API | Render, Fly or Railway. Build `turbo build --filter=api...`, start `node apps/api/dist/main.js`. Env: `DATABASE_URL`, `SESSION_SECRET`, `WEB_ORIGIN` |
| Database | Neon or Supabase, with `drizzle-kit migrate` run on deploy |
| CI | GitHub Actions: `pnpm install` → `turbo lint typecheck test build`. Only affected packages run, thanks to caching |
| Domains | `draftmon.com` → Vercel, `api.draftmon.com` → API host. With the Next rewrites, the browser never calls `api.` directly |

---

## Principles (SOLID and KISS)

- **Single responsibility:** one module, one reason to change. Route handlers parse, call a service and respond. Services hold the rules. Repositories hold the SQL.
- **Open/closed:** the scorer and effect registries in the engine, and the variant maps in components.
- **Interface segregation:** small repository interfaces per resource, not one big `Storage` class.
- **Dependency inversion:** `createApp({ repos, clock, rng })`. Pass the clock and rng in, so tests are deterministic.
- **KISS:**
  - no global state library; React state plus a few hooks is enough
  - no GraphQL; REST plus zod is enough
  - no microservices beyond the one API
  - keep lobby polling unless you actually need sub-second updates; add WebSockets to `apps/api` later if you do

---

## Estimate

| Phase | Effort |
|---|---|
| 0. Baseline | 0.5 day |
| 1. Turborepo + engine package | 1 day |
| 2. API app | 1–2 days |
| 3. Postgres | 1–2 days |
| 4. Tailwind only | 2–3 days |
| 5. Next.js | 2–3 days |
| 6. Engine readability | 1 day (parallel with 4) |
| 7. Deploy + CI | 0.5 day |
| **Total** | **about 8–12 working days** |

Phases 4 (styling) and 5 (Next.js) are the biggest. Phases 1–3 are the riskiest, so do them first while the UI is unchanged.
