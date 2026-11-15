import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createLobbyHandler } from './scripts/lobby.mjs'

type LobbyServer = { middlewares: { use: (handler: ReturnType<typeof createLobbyHandler>) => void } }
type DevServer = LobbyServer & { ssrLoadModule: (path: string) => Promise<Record<string, unknown>> }

const lobby = {
  name: 'league-lobby',
  configureServer(server: DevServer) {
    server.middlewares.use(createLobbyHandler(undefined, async () =>
      await server.ssrLoadModule('/src/engine/tournament.ts') as typeof import('./src/engine/tournament')))
  },
  configurePreviewServer(server: LobbyServer & { config: { root: string } }) {
    const root = server.config.root.replace(/\\/g, '/').split('/').map((part, index) =>
      index === 0 && /^[A-Za-z]:$/.test(part) ? part : encodeURIComponent(part)).join('/')
    const entry = `file://${root.startsWith('/') ? '' : '/'}${root}/dist-server/tournament.js`
    server.middlewares.use(createLobbyHandler(undefined, () => import(entry)))
  },
}

export default defineConfig(({ isSsrBuild }: { isSsrBuild?: boolean }) => ({
  plugins: [react(), tailwindcss(), lobby],
  build: { copyPublicDir: !isSsrBuild },
}))
