import Script from 'next/script'

/**
 * Draftmon's AdSense publisher ID. It is public (it also appears in
 * /ads.txt, as `pub-…`), so it lives in the code instead of build settings.
 */
export const ADSENSE_CLIENT = 'ca-pub-4256174987521965'

/**
 * Loads AdSense once for the whole site. Placement is left to Auto ads, so
 * the layout reserves no ad space; turn formats on or off and exclude pages
 * from the AdSense dashboard. Development builds make no ad requests.
 */
export function AutoAds() {
  if (process.env.NODE_ENV !== 'production') return null
  return (
    <Script
      id="draftmon-adsense"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  )
}
