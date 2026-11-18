import type { Layer } from '../types.ts'

export const LINE_HEIGHT = 1.2 // must match .layer line-height in Stage.css
export const fontStack = (font: string) => `"${font}", sans-serif`

export function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = src
  return img.decode().then(() => img)
}

// Draw the photo at full resolution, then every layer using the same math as Stage.css.
// `contain` mirrors the CSS tab's translate: clamp(), which keeps each box inside the photo.
export async function renderPng(photoSrc: string, layers: Layer[], contain: boolean): Promise<Blob> {
  const base = await loadImage(photoSrc)
  const W = base.naturalWidth
  const H = base.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not supported')
  ctx.drawImage(base, 0, 0)

  // Top-left corner of a w×h box centered on the layer's point.
  const place = (l: Layer, w: number, h: number) => {
    const left = (l.x / 100) * W - w / 2
    const top = (l.y / 100) * H - h / 2
    // Same order as CSS clamp(min, val, max): the min (edge at 0) wins when the box is bigger than the photo.
    return contain ? [Math.max(0, Math.min(left, W - w)), Math.max(0, Math.min(top, H - h))] : [left, top]
  }

  for (const l of layers) {
    const s = (l.size / 100) * W
    if (l.type === 'image') {
      const img = await loadImage(l.src)
      const h = (s * img.naturalHeight) / img.naturalWidth
      const [left, top] = place(l, s, h)
      ctx.drawImage(img, left, top, s, h)
      continue
    }
    ctx.font = `${s}px ${fontStack(l.font)}`
    await document.fonts.load(ctx.font, l.text)
    ctx.fillStyle = l.color
    ctx.textAlign = 'center'
    const lines = l.text.split('\n')
    const lh = s * LINE_HEIGHT
    const w = Math.max(...lines.map((line) => ctx.measureText(line).width))
    const [left, top] = place(l, w, lines.length * lh)
    // Place baselines like a CSS line box: half-leading + ascent of the primary font.
    const { fontBoundingBoxAscent: a, fontBoundingBoxDescent: d } = ctx.measureText(l.text)
    lines.forEach((line, i) => ctx.fillText(line, left + w / 2, top + i * lh + (lh - a - d) / 2 + a))
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Export failed'))), 'image/png'),
  )
}
