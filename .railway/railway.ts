import { defineRailway, preserve, project, service, volume } from 'railway/iac'

export default defineRailway(() => {
  const screenshots = volume('screenshots', { sizeMB: 1024 })
  const api = service('api', {
    build: 'pnpm exec turbo run build --filter=@draftmon/api...',
    start: 'node apps/api/dist/main.js',
    preDeploy: 'pnpm db:migrate',
    healthcheck: '/healthz',
    volumeMounts: { '/data': screenshots },
    env: {
      HOST: '0.0.0.0',
      POKE_BATTLE_SECURE_COOKIES: '1',
      POKE_BATTLE_SCREENSHOT_DIRECTORY: '/data/bug-screenshots',
      DATABASE_URL: preserve(),
      PUBLIC_APP_URL: preserve(),
      RESEND_API_KEY: preserve(),
      POKE_BATTLE_MAIL_FROM: preserve(),
      DRAFTMON_GITHUB_REPOSITORY: preserve(),
      DRAFTMON_GITHUB_TOKEN: preserve(),
    },
  })
  return project('draftmon', { resources: [api, screenshots] })
})
