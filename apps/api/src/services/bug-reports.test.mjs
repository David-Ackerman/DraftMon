import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createBugReports } from './bug-reports.ts'

const env = {
  DRAFTMON_GITHUB_REPOSITORY: 'draftmon/game',
  DRAFTMON_GITHUB_TOKEN: 'test-token',
  PUBLIC_APP_URL: 'https://play.example.com',
}
const report = {
  title: 'Broken replay',
  description: '@someone\nThe log freezes.',
}
const image = Buffer.from([0xff, 0xd8, 0xff, 0xff, 0xd9])
const screenshot = 'data:image/jpeg;base64,' + image.toString('base64')
let folder

beforeEach(() => {
  folder = mkdtempSync(join(tmpdir(), 'draftmon-bug-reports-'))
})
afterEach(() => {
  vi.restoreAllMocks()
  rmSync(folder, { recursive: true, force: true })
})

async function call(handler, body, pathname = '/api/bug-reports') {
  const request = Object.assign(
    Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []),
    {
      method: body ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json' },
      socket: { remoteAddress: '127.0.0.1' },
    },
  )
  const result = {}
  await handler(
    request,
    {
      writeHead(status, headers) {
        Object.assign(result, { status, headers })
      },
      end(value) {
        result.body = Buffer.isBuffer(value) ? value : JSON.parse(value)
      },
    },
    pathname,
  )
  return result
}

test('creates a GitHub issue and links to the optional screenshot on the configured HTTPS host', async () => {
  const send = vi.fn(async () => Response.json({ number: 14 }, { status: 201 }))
  const handler = createBugReports(join(folder, 'bug-screenshots'), env, send)
  expect(await call(handler, { ...report, screenshot })).toMatchObject({
    status: 201,
    body: { number: 14, url: 'https://github.com/draftmon/game/issues/14' },
  })
  const [[url, options]] = send.mock.calls
  expect(url).toBe('https://api.github.com/repos/draftmon/game/issues')
  expect(options.headers.Authorization).toBe('Bearer test-token')
  const payload = JSON.parse(options.body)
  expect(payload.title).toBe(report.title)
  expect(payload.body).toContain('\n\n    @someone\n    The log freezes.')
  const screenshotURL = new URL(
    payload.body.match(/\[View screenshot\]\(([^)]+)\)/)[1],
  )
  expect(screenshotURL.origin).toBe(env.PUBLIC_APP_URL)
  expect(await call(handler, undefined, screenshotURL.pathname)).toMatchObject({
    status: 200,
    headers: { 'Content-Type': 'image/jpeg' },
    body: image,
  })
})

test('allows reports without a screenshot and validates input before contacting GitHub', async () => {
  const send = vi.fn(async () => Response.json({ number: 15 }, { status: 201 }))
  const handler = createBugReports(join(folder, 'bug-screenshots'), env, send)
  expect(await call(handler, { ...report, title: '' })).toMatchObject({
    status: 400,
    body: { error: 'invalid_report' },
  })
  expect(
    await call(handler, {
      ...report,
      screenshot: 'data:image/svg+xml;base64,YQ==',
    }),
  ).toMatchObject({
    status: 400,
    body: { error: 'invalid_screenshot' },
  })
  expect(send).not.toHaveBeenCalled()
  expect(await call(handler, report)).toMatchObject({ status: 201 })
  expect(send.mock.calls[0][1].body).not.toContain('View screenshot')
})

test('uses the Draftmon repository when only the server token is configured', async () => {
  const send = vi.fn(async () => Response.json({ number: 16 }, { status: 201 }))
  const handler = createBugReports(
    folder,
    { DRAFTMON_GITHUB_TOKEN: 'test-token' },
    send,
  )
  expect(await call(handler, report)).toMatchObject({
    status: 201,
    body: {
      number: 16,
      url: 'https://github.com/David-Ackerman/DraftMon/issues/16',
    },
  })
  expect(send.mock.calls[0][0]).toBe(
    'https://api.github.com/repos/David-Ackerman/DraftMon/issues',
  )
})

test('cleans up a screenshot when GitHub rejects creation and reports missing configuration', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const send = vi.fn(async () => new Response(null, { status: 403 }))
  const file = join(folder, 'bug-screenshots')
  const handler = createBugReports(file, env, send)
  expect(await call(handler, { ...report, screenshot })).toMatchObject({
    status: 502,
    body: { error: 'github_unavailable' },
  })
  expect(readdirSync(join(folder, 'bug-screenshots'))).toEqual([])
  expect(await call(createBugReports(file, {}, send), report)).toMatchObject({
    status: 503,
    body: { error: 'not_configured' },
  })
  expect(send).toHaveBeenCalledOnce()
})
