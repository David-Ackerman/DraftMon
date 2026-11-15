import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { extname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLobbyHandler } from './lobby.mjs'

const root = fileURLToPath(new URL('../dist/', import.meta.url))
const tournament = await import('../dist-server/tournament.js')
const api = createLobbyHandler(undefined, () => tournament)
const accountPages = new Set(['/cadastro', '/recuperar-senha', '/redefinir-senha', '/email-da-conta'])
const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg',
}

function serve(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return response.writeHead(405).end()
  let file
  let info
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    file = resolve(root, path === '/' || accountPages.has(path) ? 'index.html' : `.${path}`)
    const local = relative(root, file)
    if (local === '..' || local.startsWith(`..${sep}`) || resolve(root, local) !== file) return response.writeHead(404).end()
    info = statSync(file)
    if (!info.isFile()) return response.writeHead(404).end()
  } catch {
    return response.writeHead(404).end()
  }
  response.writeHead(200, {
    'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream',
    'Content-Length': info.size,
    'Cache-Control': file.startsWith(resolve(root, 'assets') + sep) ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  if (request.method === 'HEAD') return response.end()
  createReadStream(file).on('error', () => response.destroy()).pipe(response)
}

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.PORT || 4173)
createServer((request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'no-referrer')
  void api(request, response, () => serve(request, response)).catch(() => {
    if (!response.headersSent) response.writeHead(500)
    response.end()
  })
}).listen(port, host, () => console.log(`Draftmon running at http://${host}:${port}`))
setInterval(() => void api.expire().catch(console.error), 5000).unref()
