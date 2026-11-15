# Draftmon deployment

The web app runs on Vercel. Railway runs the Hono API and its tournament deadline job. Neon or Supabase provides Postgres.

## Prepare and deploy the API

1. Create a dedicated Postgres database in Neon or Supabase. Set Railway's `DATABASE_URL` to its TLS connection string. Use a direct connection for running migrations.
2. Link the Git repository to the `api` service in Railway. Use the repository root. Configure the service from [.railway/railway.ts](../.railway/railway.ts) with Railway Infrastructure as Code, or copy its build, start, pre-deploy and health check settings into the service. Use Node.js 24, the pinned pnpm version, and install build dependencies. The pre-deploy command applies the SQL migrations before the API starts.
3. Set `HOST=0.0.0.0` and `POKE_BATTLE_SECURE_COOKIES=1`. Set `PUBLIC_APP_URL` to the HTTPS URL of the web app. Configure the optional Resend and GitHub credentials from [the API environment example](../apps/api/.env.example). The API uses opaque session tokens whose hashes are stored in Postgres.
4. Mount persistent storage for `POKE_BATTLE_SCREENSHOT_DIRECTORY` if screenshot reports are enabled. The Railway configuration mounts it under `/data`. Generate an HTTPS domain for the API and check that `/healthz` returns `{"ok":true}`.

[Railway Infrastructure as Code](https://docs.railway.com/infrastructure-as-code/reference) · [Drizzle migrations](https://orm.drizzle.team/docs/drizzle-kit-migrate)

## Deploy the web app

1. Import the same Git repository into Vercel. Set Root Directory to `apps/web` and include source files outside that directory. Use the Next.js framework preset and Node.js 24.
2. Enable the pinned pnpm version with `ENABLE_EXPERIMENTAL_COREPACK=1` in the Vercel project. Set `API_URL` to the API's HTTPS origin and `NEXT_PUBLIC_SITE_URL` to the web app's canonical HTTPS origin. Set the `NEXT_PUBLIC_ADSENSE_*` variables if you have ad units for that domain. These values are read at build time.
3. Add your web domain in Vercel and follow its DNS instructions. The web app sends browser requests to `/api/*` on the same domain and Next forwards them to the API. Rebuild after changing the API origin.
4. Verify the home page, a Pokédex entry, sign-in and a guest invitation using the public deployment. Test password recovery and bug reports with the configured service accounts.

[Deploying Turborepo to Vercel](https://vercel.com/docs/monorepos/turborepo) · [Vercel Corepack settings](https://vercel.com/docs/builds/configure-a-build#corepack)

## Move existing JSON data

Stop the old API and keep a private copy of its data directory. Run the importer before the new API starts accepting requests. It writes all three resources in one transaction and requires an empty Draftmon database.

```bash
export DATABASE_URL='postgresql://…'
pnpm db:migrate
POKE_BATTLE_ROOMS_FILE=/path/to/rooms.json POKE_BATTLE_ACCOUNTS_FILE=/path/to/accounts.json \
  pnpm --filter @draftmon/api import-json
```

The importer reads `pokedex.json` beside the rooms file. With no `DATABASE_URL` it imports into the local PGlite directory. To import an old checksum-protected archive, pass its absolute path to `import-json`. An archive import revokes its sessions and reset tokens. A direct import preserves those values and accepts existing scrypt passwords. Copy the old `bug-screenshots/` directory to the configured screenshot volume to preserve links.

## Backup and restore

Use the managed database provider's backups or `pg_dump` and `pg_restore`. Run restores against a fresh database and verify the result before changing the production connection string.

```bash
pg_dump --format=custom --no-owner --no-acl --file=draftmon.dump "$DATABASE_URL"
pg_restore --exit-on-error --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" draftmon.dump
```

Confirm that an account can sign in and that its Pokédex and tournament results survived. Protect backups because they contain account email addresses, password hashes and session hashes. Back up screenshot files separately. For PGlite, stop the API and copy the entire database directory to a separate destination. Point `POKE_BATTLE_DB_DIRECTORY` at a fresh restored copy before starting the API.

## Google Cloud VM

To run both apps on a Compute Engine VM, install Node.js 24 and pnpm, set the web and API variables above and build on the VM. Use `API_URL=http://127.0.0.1:4000` and `HOST=127.0.0.1`. Run the web and API as separate services with `pnpm --filter @draftmon/web start` and `pnpm --filter @draftmon/api start`. Forward public HTTPS traffic to the Next server on port 3000 through Caddy or your Google Cloud load balancer. Keep the API on port 4000 internal to the VM.
