import { roomBodies } from '@draftmon/contracts'
import type { Hono } from 'hono'
import type { IncomingMessage } from 'node:http'
import type { Lobbies } from '../services/lobbies'
import type { IdentifyPlayer, Player } from '../services/players'
import type { State } from '../state'
import { validateBody } from './transport'
import type { AppBindings } from './transport'

export function mountLobbyRoutes(
  app: Hono<AppBindings>,
  state: State,
  identify: IdentifyPlayer,
  lobbies: Lobbies,
) {
  const run = <T extends object>(
    request: IncomingMessage,
    task: (player: Player) => T,
  ) => state.transaction(['accounts', 'rooms'], () => task(identify(request)))

  app.post('/api/rooms', async (context) => {
    const request = context.env.incoming
    const body = await validateBody(request, roomBodies.create)
    return context.json(
      await run(request, (player) => lobbies.create(player, body)),
    )
  })
  app.get('/api/rooms/:code', async (context) =>
    context.json(
      await run(context.env.incoming, (player) =>
        lobbies.get(player, context.req.param('code')),
      ),
    ),
  )
  app.get('/api/rooms/:code/replay', async (context) =>
    context.json(
      await run(context.env.incoming, (player) =>
        lobbies.replay(player, context.req.param('code'), context.req.query()),
      ),
    ),
  )
  app.post('/api/rooms/:code/join', async (context) => {
    const request = context.env.incoming
    const body = await validateBody(request, roomBodies.join)
    return context.json(
      await run(request, (player) =>
        lobbies.join(player, context.req.param('code'), body),
      ),
    )
  })
  app.post('/api/rooms/:code/start', async (context) => {
    const request = context.env.incoming
    await validateBody(request, roomBodies.start)
    return context.json(
      await run(request, (player) =>
        lobbies.start(player, context.req.param('code')),
      ),
    )
  })
  app.post('/api/rooms/:code/result', async (context) => {
    const request = context.env.incoming
    const body = await validateBody(request, roomBodies.result)
    return context.json(
      await run(request, (player) =>
        lobbies.result(player, context.req.param('code'), body),
      ),
    )
  })
  for (const action of ['catch', 'reroll', 'ready'] as const) {
    app.post(`/api/rooms/:code/${action}`, async (context) => {
      const request = context.env.incoming
      // Keep each action paired with its own validated command body.
      const command =
        action === 'catch'
          ? { action, body: await validateBody(request, roomBodies.catch) }
          : action === 'reroll'
            ? { action, body: await validateBody(request, roomBodies.reroll) }
            : { action, body: await validateBody(request, roomBodies.ready) }
      const code = context.req.param('code')
      return context.json(
        await run(request, (player) => lobbies.act(player, code, command)),
      )
    })
  }
}
