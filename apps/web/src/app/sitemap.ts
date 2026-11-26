import type { MetadataRoute } from 'next'
import { gameData } from '@draftmon/content'
import { siteUrl } from './site'

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteUrl) return []
  return [
    '/',
    '/how-to-play',
    '/about',
    '/privacy',
    '/pokedex',
    ...gameData.pokemon.map(({ name }) => '/pokedex/' + name),
    ...gameData.regions.map(({ name }) => '/regions/' + name),
  ].map((path) => ({ url: new URL(path, siteUrl).href }))
}
