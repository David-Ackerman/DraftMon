import Script from 'next/script'

const publisher = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim()

/**
 * Loads AdSense once for the whole site. Placement is left to Auto ads, so
 * the layout reserves no ad space; turn formats on or off and exclude pages
 * from the AdSense dashboard.
 */
export function AutoAds() {
  if (
    process.env.NODE_ENV !== 'production' ||
    !publisher ||
    !/^ca-pub-\d{16}$/.test(publisher)
  )
    return null
  return (
    <Script
      id="draftmon-adsense"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisher}`}
    />
  )
}
