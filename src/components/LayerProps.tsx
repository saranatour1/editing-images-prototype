import type { Layer, LayerPatch } from '../types.ts'
import './LayerProps.css'

type Props = { layer: Layer; fonts: string[]; onChange: (patch: LayerPatch) => void; onRemove: () => void }

export default function LayerProps({ layer, fonts, onChange, onRemove }: Props) {
  return (
    <div className="props">
      <h2>Selected</h2>
      {layer.type === 'text' && (
        <>
          <label>
            Font
            <select value={layer.font} onChange={(e) => onChange({ font: e.target.value })}>
              {fonts.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label>
            Color
            <input type="color" value={layer.color} onChange={(e) => onChange({ color: e.target.value })} />
          </label>
        </>
      )}
      <label>
        Size
        <input
          type="range"
          min={1}
          max={layer.type === 'image' ? 100 : 40}
          step={0.5}
          value={layer.size}
          onChange={(e) => onChange({ size: +e.target.value })}
        />
      </label>
      <button className="danger" onClick={onRemove}>
        Delete
      </button>
    </div>
  )
}
