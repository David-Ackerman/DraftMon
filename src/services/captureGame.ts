const maxScreenshotLength = 1024 * 1024

export async function captureGame(target: HTMLElement) {
  const { toCanvas } = await import('html-to-image')
  const bounds = target.getBoundingClientRect()
  const visibleTop = Math.max(0, -bounds.top)
  const visibleBottom = Math.min(bounds.height, window.innerHeight - bounds.top)
  if (bounds.width < 1 || visibleBottom <= visibleTop) throw new Error('No visible game area')
  const backgroundColor = getComputedStyle(target).getPropertyValue('--bg').trim()
  const source = await toCanvas(target, {
    backgroundColor,
    pixelRatio: Math.min(1, 1280 / bounds.width, 4096 / bounds.height),
    skipFonts: true,
    filter: (node) => !(node instanceof Element && node.matches('[data-report-private], iframe')),
  })
  const scale = source.height / bounds.height
  const top = Math.round(visibleTop * scale)
  const height = Math.max(1, Math.round(visibleBottom * scale) - top)
  const cropped = document.createElement('canvas')
  cropped.width = source.width
  cropped.height = height
  const context = cropped.getContext('2d')
  if (!context) throw new Error('Screenshot canvas unavailable')
  context.drawImage(source, 0, top, source.width, height, 0, 0, cropped.width, cropped.height)
  for (const quality of [0.85, 0.65, 0.45]) {
    const jpeg = cropped.toDataURL('image/jpeg', quality)
    if (jpeg.startsWith('data:image/jpeg;base64,') && jpeg.length <= maxScreenshotLength) return jpeg
  }
  throw new Error('Screenshot is too large')
}
