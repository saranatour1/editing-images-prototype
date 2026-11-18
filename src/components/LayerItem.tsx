import { useRef, type CSSProperties, type FocusEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { fontStack } from '../lib/canvas.ts'
import type { ContainMode, Layer, LayerPatch } from '../types.ts'

type Props = {
  layer: Layer
  mode: ContainMode
  selected: boolean
  editing: boolean
  onSelect: () => void
  onEdit: (editing: boolean) => void
  onChange: (patch: LayerPatch) => void
  onRemove: () => void
}

// Pointer and layer position at drag start; pad = how close (in %) the center may get to an edge.
type Drag = { px: number; py: number; x: number; y: number; stage: DOMRect; padX: number; padY: number }

const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi))

// Ref callback instead of an effect: React calls it when `editing` turns on and the ref is attached.
const focusAndSelectAll = (el: HTMLElement | null) => {
  if (!el) return
  el.focus()
  getSelection()?.selectAllChildren(el)
}

export default function LayerItem({ layer, mode, selected, editing, onSelect, onEdit, onChange, onRemove }: Props) {
  const drag = useRef<Drag | null>(null)

  function startDrag(e: PointerEvent<HTMLDivElement>) {
    e.stopPropagation() // keep the stage from deselecting
    onSelect()
    const stage = e.currentTarget.parentElement
    if (editing || !stage) return
    const area = stage.getBoundingClientRect()
    // JavaScript tab: measure the item so its center stays half its size away from the edges.
    // CSS tab: no measuring, the stylesheet's translate: clamp() keeps the box inside.
    const box = mode === 'js' ? e.currentTarget.getBoundingClientRect() : null
    drag.current = {
      px: e.clientX,
      py: e.clientY,
      x: layer.x,
      y: layer.y,
      stage: area,
      padX: box ? (box.width / 2 / area.width) * 100 : 0,
      padY: box ? (box.height / 2 / area.height) * 100 : 0,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function moveDrag(e: PointerEvent) {
    const d = drag.current
    if (!d) return
    onChange({
      x: clamp(d.x + ((e.clientX - d.px) / d.stage.width) * 100, d.padX, 100 - d.padX),
      y: clamp(d.y + ((e.clientY - d.py) / d.stage.height) * 100, d.padY, 100 - d.padY),
    })
  }

  function finishEdit(e: FocusEvent<HTMLDivElement>) {
    if (!editing) return
    const text = e.currentTarget.innerText.replace(/\n$/, '')
    onEdit(false)
    if (text.trim()) onChange({ text })
    else onRemove()
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (editing) {
      if (e.key === 'Escape') e.currentTarget.blur()
      return
    }
    if (e.key === 'Delete' || e.key === 'Backspace') onRemove()
    if (e.key === 'Enter' && layer.type === 'text') onEdit(true)
  }

  // Position is only CSS variables; Stage.css decides how they turn into a place on the photo.
  const style = {
    '--x': layer.x,
    '--y': layer.y,
    ...(layer.type === 'text' && { fontSize: `${layer.size}cqw`, fontFamily: fontStack(layer.font), color: layer.color }),
  } as CSSProperties

  return (
    <div
      ref={editing ? focusAndSelectAll : undefined}
      tabIndex={0}
      className={selected ? 'layer selected' : 'layer'}
      style={style}
      contentEditable={editing ? 'plaintext-only' : undefined}
      suppressContentEditableWarning
      onFocus={onSelect}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onLostPointerCapture={() => (drag.current = null)}
      onDoubleClick={() => layer.type === 'text' && onEdit(true)}
      onBlur={finishEdit}
      onKeyDown={onKeyDown}
    >
      {layer.type === 'image' ? (
        <img src={layer.src} alt="" draggable={false} style={{ width: `${layer.size}cqw` }} />
      ) : (
        layer.text
      )}
    </div>
  )
}
