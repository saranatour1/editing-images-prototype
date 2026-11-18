import type { Layer } from '../types.ts'

export const LINE_HEIGHT = 1.2 // must match .layer line-height in Stage.css
export const fontStack = (font: string) => `"${font}", sans-serif`

export function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = src
  return img.decode().then(() => img)
}

// Draw the photo at full resolution, then every layer using the same % math as the CSS.
export async function renderPng(photoSrc: string, layers: Layer[]): Promise<Blob> {
  const base = await loadImage(photoSrc)
  const canvas = document.createElement('canvas')
  canvas.width = base.naturalWidth
  canvas.height = base.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not supported')
  ctx.drawImage(base, 0, 0)

  for (const l of layers) {
    const x = (l.x / 100) * canvas.width
    const y = (l.y / 100) * canvas.height
    const s = (l.size / 100) * canvas.width
    if (l.type === 'image') {
      const img = await loadImage(l.src)
      const h = (s * img.naturalHeight) / img.naturalWidth
      ctx.drawImage(img, x - s / 2, y - h / 2, s, h)
      continue
    }
    ctx.font = `${s}px ${fontStack(l.font)}`
    await document.fonts.load(ctx.font, l.text)
    ctx.fillStyle = l.color
    ctx.textAlign = 'center'
    // Place baselines like a CSS line box: half-leading + ascent of the primary font.
    const { fontBoundingBoxAscent: a, fontBoundingBoxDescent: d } = ctx.measureText(l.text)
    const lines = l.text.split('\n')
    const lh = s * LINE_HEIGHT
    const top = y - (lines.length * lh) / 2
    lines.forEach((line, i) => ctx.fillText(line, x, top + i * lh + (lh - a - d) / 2 + a))
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Export failed'))), 'image/png'),
  )
}
