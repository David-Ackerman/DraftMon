import { z } from 'zod'
import { MIN_TOURNAMENT_PLAYERS, ROOM_PLAYER_LIMIT } from './tournament'

export * from './tournament'
export * from './bug-report'

const username = z.string()
const password = z.string()
const email = z.string()
const credentials = z.object({ username, password })
export const accountBodies = {
  register: credentials.extend({ email }),
  login: credentials,
  recover: z.object({ email, language: z.string().optional() }),
  reset: z.object({ token: z.string(), password }),
  email: z.object({ email, password }),
}

const profile = z.object({ name: z.string().optional(), avatar: z.string() })
const index = z.number().int().nonnegative()
const draft = z.object({ pick: index, rerolls: index })
export const roomBodies = {
  create: z.discriminatedUnion('kind', [
    profile.extend({ kind: z.literal('room'), nameOfRoom: z.string() }),
    profile.extend({
      kind: z.literal('tournament'),
      nameOfRoom: z.string(),
      groups: z.boolean(),
      bots: z.number().int().min(0).max(8).optional(),
      minimumPlayers: z
        .number()
        .int()
        .min(MIN_TOURNAMENT_PLAYERS)
        .max(ROOM_PLAYER_LIMIT)
        .optional(),
      roundMinutes: z
        .union([
          z.literal(5),
          z.literal(10),
          z.literal(15),
          z.literal(30),
          z.literal(60),
        ])
        .optional(),
    }),
  ]),
  join: profile,
  start: z.object({}),
  result: z.object({ round: index, match: index, winner: z.string() }),
  catch: draft.extend({ pokemon: z.string() }),
  reroll: draft.extend({ mode: z.enum(['type', 'region', 'both']) }),
  ready: z.object({ round: index, order: z.array(z.string()).length(6) }),
}

export const pokedexBody = z.object({
  id: z.string(),
  species: z.array(z.string()).min(1).max(6),
})
export const bugReportBody = z.object({
  title: z.string(),
  description: z.string(),
  screenshot: z.string().nullish(),
})

export type BugReportBody = z.input<typeof bugReportBody>
export type PokedexBody = z.output<typeof pokedexBody>
export type RoomBody<Action extends keyof typeof roomBodies> = z.input<
  (typeof roomBodies)[Action]
>
export type RequestBodySchema = z.ZodType<Record<string, unknown>>
