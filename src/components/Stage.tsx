import type { CSSProperties } from 'react'
import type { Layer, LayerPatch, Photo } from '../types.ts'
import LayerItem from './LayerItem.tsx'
import './Stage.css'

type Props = {
  photo: Photo
  layers: Layer[]
  selected: number | null
  editing: number | null
  onSelect: (id: number | null) => void
  onEdit: (id: number | null) => void
  onChange: (id: number, patch: LayerPatch) => void
  onRemove: (id: number) => void
}

export default function Stage({ photo, layers, selected, editing, onSelect, onEdit, onChange, onRemove }: Props) {
  return (
    <div className="stage" style={{ '--ar': photo.w / photo.h } as CSSProperties} onPointerDown={() => onSelect(null)}>
      <img src={photo.src} alt="Photo being edited" />
      {layers.map((l) => (
        <LayerItem
          // remount after a text edit so React never fights the contentEditable DOM
          key={`${l.id}:${l.type === 'text' ? l.text : ''}`}
          layer={l}
          selected={l.id === selected}
          editing={l.id === editing}
          onSelect={() => onSelect(l.id)}
          onEdit={(on) => onEdit(on ? l.id : null)}
          onChange={(patch) => onChange(l.id, patch)}
          onRemove={() => onRemove(l.id)}
        />
      ))}
    </div>
  )
}
