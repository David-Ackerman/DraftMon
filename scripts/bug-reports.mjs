import { randomBytes } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fail, readBody } from './http-store.mjs'

const maxImageBytes = 768 * 1024
const uploadLimit = Math.ceil(maxImageBytes / 3) * 4 + 24 * 1024
const reportPath = '/api/bug-reports'
const screenshotPath = /^\/api\/bug-reports\/screenshots\/([a-f0-9]{48})\.jpg$/
const windowMs = 10 * 60_000

function imageBytes(value) {
  if (value == null || value === '') return null
  if (typeof value !== 'string' || !/^data:image\/jpeg;base64,[a-z0-9+/]+={0,2}$/i.test(value)) {
    fail(400, 'invalid_screenshot')
  }
  const image = Buffer.from(value.slice('data:image/jpeg;base64,'.length), 'base64')
  if (image.length > maxImageBytes) fail(413, 'invalid_screenshot')
  if (image.length < 5 || !image.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ||
      !image.subarray(-2).equals(Buffer.from([0xff, 0xd9]))) fail(400, 'invalid_screenshot')
  return image
}

export function createBugReports(roomsFile, env = process.env, send = fetch) {
  const repository = env.DRAFTMON_GITHUB_REPOSITORY?.trim()
  const token = env.DRAFTMON_GITHUB_TOKEN?.trim()
  const configured = Boolean(repository && /^[\w.-]+\/[\w.-]+$/.test(repository) && token)
  const directory = join(dirname(roomsFile), 'bug-screenshots')
  const appOrigin = URL.canParse(env.PUBLIC_APP_URL) ? new URL(env.PUBLIC_APP_URL) : null
  const screenshotOrigin = appOrigin?.protocol === 'https:' ? appOrigin.origin : null
  const attempts = new Map()
  let resetAt = 0
  let total = 0

  function limit(address) {
    const now = Date.now()
    if (now >= resetAt) {
      resetAt = now + windowMs
      attempts.clear()
      total = 0
    }
    // A local proxy shares a socket address across visitors. Apply only the global cap there.
    if (total >= 20) fail(429, 'rate_limited')
    if (address && !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) {
      const count = attempts.get(address) ?? 0
      if (count >= 3) fail(429, 'rate_limited')
      attempts.set(address, count + 1)
    }
    total++
  }

  return async function bugReports(request, response, path) {
    const match = screenshotPath.exec(path)
    if (!match && path !== reportPath) return false
    const reply = (status, body) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      response.end(JSON.stringify(body))
      return true
    }
    try {
      if (match) {
        if (request.method !== 'GET' && request.method !== 'HEAD') fail(405, 'method_not_allowed')
        const data = await readFile(join(directory, match[1] + '.jpg')).catch((error) => {
          if (error.code === 'ENOENT') fail(404, 'screenshot_not_found')
          throw error
        })
        response.writeHead(200, { 'Content-Type': 'image/jpeg', 'X-Content-Type-Options': 'nosniff',
          'Content-Length': data.length, 'Cache-Control': 'no-store' })
        response.end(request.method === 'HEAD' ? undefined : data)
        return true
      }
      if (request.method !== 'POST') fail(405, 'method_not_allowed')
      if (!configured) fail(503, 'not_configured')
      if (request.headers['content-type']?.split(';')[0]?.toLowerCase() !== 'application/json') fail(415, 'invalid_report')
      if (Number(request.headers['content-length']) > uploadLimit) fail(413, 'invalid_screenshot')
      const data = await readBody(request, uploadLimit)
      const title = typeof data.title === 'string' ? data.title.trim().replace(/[\r\n]+/g, ' ') : ''
      const description = typeof data.description === 'string' ? data.description.trim() : ''
      if (!title || title.length > 120 || !description || description.length > 4000) fail(400, 'invalid_report')
      const screenshot = imageBytes(data.screenshot)
      if (screenshot && !screenshotOrigin) fail(503, 'screenshots_not_configured')
      limit(request.socket.remoteAddress)

      let screenshotFile
      let screenshotURL
      if (screenshot) {
        const name = randomBytes(24).toString('hex') + '.jpg'
        await mkdir(directory, { recursive: true, mode: 0o700 })
        const file = join(directory, name)
        await writeFile(file, screenshot, { flag: 'wx', mode: 0o600 })
        screenshotFile = file
        screenshotURL = `${screenshotOrigin}${reportPath}/screenshots/${name}`
      }

      const plainText = description.split(/\r?\n/).map((line) => '    ' + line).join('\n')
      const body = '## Draftmon bug report\n\n' + plainText +
        (screenshotURL ? `\n\n[View screenshot](${screenshotURL})` : '')
      const result = await send(`https://api.github.com/repos/${repository}/issues`, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ title, body }),
        redirect: 'error',
        signal: AbortSignal.timeout(12_000),
      })
      if (!result.ok) {
        if (screenshotFile) await unlink(screenshotFile).catch(() => console.error('Draftmon could not remove a rejected screenshot.'))
        console.error('Draftmon GitHub issue request failed with status', result.status)
        fail(502, 'github_unavailable')
      }
      const { number } = await result.json()
      if (!Number.isSafeInteger(number) || number < 1) fail(502, 'github_unavailable')
      return reply(201, { number, url: `https://github.com/${repository}/issues/${number}` })
    } catch (error) {
      if (!error.status) console.error('Draftmon bug report could not be completed.', error.code ?? error.name)
      return reply(error.status ?? 502, { error: error.status === 413 ? 'invalid_screenshot' : error.status ? error.message : 'github_unavailable' })
    }
  }
}
