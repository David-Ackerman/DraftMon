import type { Metadata } from 'next'

const origin = process.env.NEXT_PUBLIC_SITE_URL
export const siteUrl = origin ? new URL(origin) : undefined

export function publicMetadata(
  title: string,
  description: string,
  path: string,
  image = '/pokeball.svg',
): Metadata {
  return {
    title,
    description,
    ...(siteUrl && {
      alternates: { canonical: new URL(path, siteUrl) },
      openGraph: {
        title,
        description,
        url: new URL(path, siteUrl),
        images: [new URL(image, siteUrl)],
      },
    }),
  }
}
