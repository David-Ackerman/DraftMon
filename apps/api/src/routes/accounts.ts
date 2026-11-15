import { accountBodies } from '@draftmon/contracts'
import type { RequestBodySchema } from '@draftmon/contracts'
import type { Hono } from 'hono'
import type { createAccounts } from '../auth/accounts'
import type { State } from '../state'
import { createReply, validateBody } from './transport'
import type { AppBindings } from './transport'

export function mountAccountRoutes(
  app: Hono<AppBindings>,
  state: State,
  accounts: ReturnType<typeof createAccounts>,
) {
  app.all('/api/auth/*', async (context) => {
    const path = context.req.path
    const action = path.slice('/api/auth/'.length)
    const request = context.env.incoming
    const body =
      context.req.method === 'POST' && Object.hasOwn(accountBodies, action)
        ? await validateBody(
            request,
            accountBodies[
              action as keyof typeof accountBodies
            ] as RequestBodySchema,
          )
        : {}
    const reply = createReply(context)
    return reply.json(
      await state.transaction(['accounts'], () =>
        accounts.handle(request, reply.response, path, body),
      ),
    )
  })
}
