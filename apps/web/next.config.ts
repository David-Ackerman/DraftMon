import type { NextConfig } from 'next'

const config: NextConfig = {
  agentRules: false,
  transpilePackages: [
    '@draftmon/content',
    '@draftmon/engine',
    '@draftmon/contracts',
  ],
  async redirects() {
    return [
      'cadastro',
      'recuperar-senha',
      'redefinir-senha',
      'email-da-conta',
    ].map((page) => ({
      source: '/' + page,
      destination: '/account/' + page,
      permanent: false,
    }))
  },
  async rewrites() {
    const api = (process.env.API_URL ?? 'http://127.0.0.1:4000').replace(
      /\/$/,
      '',
    )
    return [{ source: '/api/:path*', destination: api + '/api/:path*' }]
  },
}

export default config
