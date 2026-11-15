import { pokedexBody } from '@draftmon/contracts'
import type { Hono } from 'hono'
import type { createProgress } from '../services/progress'
import type { IdentifyPlayer } from '../services/players'
import type { State } from '../state'
import { validateBody } from './transport'
import type { AppBindings, ApiContext } from './transport'

export function mountProgressRoutes(
  app: Hono<AppBindings>,
  state: State,
  identify: IdentifyPlayer,
  progress: ReturnType<typeof createProgress>,
) {
  async function handle(context: ApiContext) {
    const request = context.env.incoming
    const owner = context.req.query('owner')
    const battle =
      context.req.method === 'POST'
        ? await validateBody(request, pokedexBody)
        : undefined
    const data = await state.transaction(['accounts', 'rooms', 'pokedex'], () =>
      progress(identify(request), owner, battle),
    )
    return context.json(data)
  }
  app.get('/api/profile/pokedex', handle)
  app.post('/api/profile/pokedex', handle)
  app.all('/api/profile/pokedex', (context) =>
    context.json({ error: 'Action not available.' }, 405),
  )
}
