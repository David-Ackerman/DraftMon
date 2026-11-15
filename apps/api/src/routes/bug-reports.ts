import { bugReportBody } from '@draftmon/contracts'
import type { Hono } from 'hono'
import { fail, readBody } from '../http'
import type { ReadBody } from '../http'
import type { createBugReports } from '../services/bug-reports'
import { createReply } from './transport'
import type { ApiContext, AppBindings } from './transport'

export const readBugReport: ReadBody = async (request, maxBytes) => {
  const parsed = bugReportBody.safeParse(await readBody(request, maxBytes))
  if (!parsed.success) {
    fail(
      400,
      parsed.error.issues.some(({ path }) => path[0] === 'screenshot')
        ? 'invalid_screenshot'
        : 'invalid_report',
    )
  }
  return parsed.data
}

export function mountBugReportRoutes(
  app: Hono<AppBindings>,
  service: ReturnType<typeof createBugReports>,
) {
  async function handle(context: ApiContext) {
    const reply = createReply(context)
    if (
      !(await service(context.env.incoming, reply.response, context.req.path))
    ) {
      return context.json({ error: 'Route not found.' }, 404)
    }
    return reply.finish()
  }
  app.all('/api/bug-reports', handle)
  app.all('/api/bug-reports/screenshots/:file', handle)
}
