# Draftmon HTTP contract

This records the routes available before the API migration. The browser calls them on its own origin. JSON requests use `Content-Type: application/json`. Errors have the shape `{ error: string }`.

## Account

Account routes return `{ account: { id, username, email } | null }`. The account session uses the HTTP-only `poke_session` cookie. The authenticated account takes precedence over guest credentials.

| Method | Path | JSON body | Successful result |
| --- | --- | --- | --- |
| GET | `/api/auth/session` | — | Account or `null` |
| POST | `/api/auth/register` | `{ username, password, email }` | Account and session cookie |
| POST | `/api/auth/login` | `{ username, password }` | Account and session cookie |
| POST | `/api/auth/logout` | — | `{ account: null }` and cleared cookie |
| POST | `/api/auth/recover` | `{ email, language? }` | `{ account: null }` regardless of whether the address has an account |
| POST | `/api/auth/reset` | `{ token, password }` | `{ account: null }` and invalidated sessions for the account |
| POST | `/api/auth/email` | `{ email, password }` | Updated account. A session is required. |

## Rooms, tournaments and Pokédex

Requests use the session cookie or `Authorization: Bearer <guest credential>`. A room code has eight hexadecimal characters. A profile is `{ name?, avatar }` and the avatar must be in the catalog.

| Method | Path | JSON body or query | Successful result |
| --- | --- | --- | --- |
| POST | `/api/rooms` | Profile plus `{ nameOfRoom, kind, groups?, bots?, roundMinutes? }` | Room. Creating a tournament requires an account. |
| GET | `/api/rooms/:code` | — | Room for a member |
| POST | `/api/rooms/:code/join` | Profile | Room |
| POST | `/api/rooms/:code/start` | `{}` | Room after the host starts the tournament |
| POST | `/api/rooms/:code/result` | `{ round, match, winner }` | Room after the host records a result in a legacy bracket |
| POST | `/api/rooms/:code/catch` | `{ pokemon, pick, rerolls }` | Room with the member’s updated draft |
| POST | `/api/rooms/:code/reroll` | `{ mode, pick, rerolls }`, mode is `type`, `region` or `both` | Room with the member’s updated draft |
| POST | `/api/rooms/:code/ready` | `{ round, order }`, with six drafted Pokémon | Room after the order is submitted |
| GET | `/api/rooms/:code/replay` | `?round=0&slot=0` | `{ left, right, level, result }` for an eligible viewer |
| GET | `/api/profile/pokedex` | `?owner=account:<id>` or `?owner=guest:<id>` | `{ counts: Record<species, number> }` for the caller |
| POST | `/api/profile/pokedex` | Same query plus `{ id, species }` | Same counts with an idempotent update for the battle ID |

Room responses contain `{ code, name, kind, revision, host, members, selfId, settings?, rounds, champion, play? }`. Play state exposes public tournament standings, deadlines and match outcomes. Each member receives only their own draft. The server advances deadlines and fills missing choices automatically.

## Bug reports

| Method | Path | JSON body | Successful result |
| --- | --- | --- | --- |
| POST | `/api/bug-reports` | `{ title, description, screenshot? }`, with an optional JPEG data URL up to 768 KiB decoded | HTTP 201 and `{ number, url }` for the created GitHub issue |
| GET or HEAD | `/api/bug-reports/screenshots/:id.jpg` | — | JPEG or its headers |

Screenshot links are opaque and can be opened by anyone who has the URL. A screenshot is included in a report only when the user submits it.
