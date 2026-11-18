import { useRef, type CSSProperties, type FocusEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { fontStack } from '../lib/canvas.ts'
import type { Layer, LayerPatch } from '../types.ts'

type Props = {
  layer: Layer
  selected: boolean
  editing: boolean
  onSelect: () => void
  onEdit: (editing: boolean) => void
  onChange: (patch: LayerPatch) => void
  onRemove: () => void
}

type Drag = { dx: number; dy: number; halfW: number; halfH: number; stage: DOMRect }

const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi))

// Ref callback instead of an effect: React calls it when `editing` turns on and the ref is attached.
const focusAndSelectAll = (el: HTMLElement | null) => {
  if (!el) return
  el.focus()
  getSelection()?.selectAllChildren(el)
}

export default function LayerItem({ layer, selected, editing, onSelect, onEdit, onChange, onRemove }: Props) {
  const drag = useRef<Drag | null>(null)

  function startDrag(e: PointerEvent<HTMLDivElement>) {
    e.stopPropagation() // keep the stage from deselecting
    onSelect()
    const stage = e.currentTarget.parentElement
    if (editing || !stage) return
    const box = e.currentTarget.getBoundingClientRect()
    drag.current = {
      dx: e.clientX - (box.left + box.width / 2),
      dy: e.clientY - (box.top + box.height / 2),
      halfW: box.width / 2,
      halfH: box.height / 2,
      stage: stage.getBoundingClientRect(),
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  // Clamp the layer's center so its whole box stays inside the photo.
  function moveDrag(e: PointerEvent) {
    const d = drag.current
    if (!d) return
    const x = clamp(e.clientX - d.dx - d.stage.left, d.halfW, d.stage.width - d.halfW)
    const y = clamp(e.clientY - d.dy - d.stage.top, d.halfH, d.stage.height - d.halfH)
    onChange({ x: (x / d.stage.width) * 100, y: (y / d.stage.height) * 100 })
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

  const position = { left: `${layer.x}%`, top: `${layer.y}%` }
  const style: CSSProperties =
    layer.type === 'text'
      ? { ...position, fontSize: `${layer.size}cqw`, fontFamily: fontStack(layer.font), color: layer.color }
      : position

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
