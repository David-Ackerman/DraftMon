import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useLanguage } from '../../services/language'

type Placement = 'left' | 'right' | 'bottom'

const placementClasses: Record<Placement, string> = {
  left: 'sticky top-4 col-start-1 row-start-1 mt-6 ml-3 mr-[134px]',
  right: 'sticky top-4 col-start-3 row-start-1 mt-6 ml-[134px] mr-3',
  bottom: 'mt-12 max-[1080px]:pr-12',
}

const publisher = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim()
const slots: Record<Placement, string | undefined> = {
  left: process.env.NEXT_PUBLIC_ADSENSE_LEFT_SLOT?.trim(),
  right: process.env.NEXT_PUBLIC_ADSENSE_RIGHT_SLOT?.trim(),
  bottom: process.env.NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT?.trim(),
}
const wideScreen = window.matchMedia(
  '(min-width: 1366px) and (any-pointer: fine)',
)
const subscribe = (onChange: () => void) => {
  wideScreen.addEventListener('change', onChange)
  return () => wideScreen.removeEventListener('change', onChange)
}

export function SideAds() {
  const wide = useSyncExternalStore(subscribe, () => wideScreen.matches)
  return wide ? (
    <>
      <AdSlot placement="left" />
      <AdSlot placement="right" />
    </>
  ) : null
}

export function AdSlot({ placement }: { placement: Placement }) {
  const { t } = useLanguage()
  const requested = useRef(false)
  const slot = slots[placement]
  const enabled = Boolean(
    publisher &&
    /^ca-pub-\d{16}$/.test(publisher) &&
    slot &&
    /^\d+$/.test(slot),
  )
  const preview = process.env.NODE_ENV === 'development'

  useEffect(() => {
    if (!enabled || preview || requested.current) return
    requested.current = true
    const ads = window as Window & {
      adsbygoogle?: Array<Record<string, never>>
    }
    if (!document.getElementById('draftmon-adsense')) {
      const script = document.createElement('script')
      script.id = 'draftmon-adsense'
      script.async = true
      script.crossOrigin = 'anonymous'
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisher}`
      document.head.append(script)
    }
    try {
      ;(ads.adsbygoogle ??= []).push({})
    } catch (error) {
      console.warn('Draftmon could not initialize an ad slot.', error)
    }
  }, [enabled, preview])

  if (!enabled && !preview) return null
  const label = t('Advertisement', 'Publicidade')
  const dimensions =
    placement === 'bottom'
      ? 'h-25 w-[250px] max-w-full min-[332px]:w-75 min-[500px]:h-15 min-[500px]:w-[468px] min-[800px]:h-[90px] min-[800px]:w-[728px]'
      : 'h-[600px] w-30 min-[1536px]:w-40'
  const creative = `inline-block align-top ${dimensions}`
  return (
    <aside
      className={`flex flex-col items-center gap-1.5 ${placementClasses[placement]}`}
      aria-label={label}
    >
      <span className="text-[.7rem] font-extrabold text-muted">{label}</span>
      {preview ? (
        <div
          className={`rounded-xl border-2 border-dashed border-muted/60 bg-panel/70 ${creative}`}
          aria-hidden="true"
        />
      ) : (
        <ins
          className={`adsbygoogle ${creative}`}
          data-ad-client={publisher}
          data-ad-slot={slot}
        />
      )}
    </aside>
  )
}
