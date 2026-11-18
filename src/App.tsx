import { useState } from 'react'
import BeforeAfter from './components/BeforeAfter.tsx'
import FileButton from './components/FileButton.tsx'
import FontLoader from './components/FontLoader.tsx'
import LayerProps from './components/LayerProps.tsx'
import ModeTabs from './components/ModeTabs.tsx'
import Stage from './components/Stage.tsx'
import StickerPicker from './components/StickerPicker.tsx'
import { loadImage, renderPng } from './lib/canvas.ts'
import type { ContainMode, Layer, LayerPatch, NewLayer, Photo } from './types.ts'
import './App.css'

const FONTS = ['Arial', 'Impact', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS', 'Comic Sans MS']
let nextId = 1

export default function App() {
  const [mode, setMode] = useState<ContainMode>('js')
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [layers, setLayers] = useState<Layer[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [fonts, setFonts] = useState(FONTS)
  const [preview, setPreview] = useState<string | null>(null)

  const sel = layers.find((l) => l.id === selected)
  const update = (id: number, patch: LayerPatch) =>
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const remove = (id: number) => {
    setLayers((ls) => ls.filter((l) => l.id !== id))
    setSelected(null)
  }
  const add = (layer: NewLayer) => {
    const id = nextId++
    setLayers((ls) => [...ls, { ...layer, id, x: 50, y: 50 }])
    setSelected(id)
    return id
  }
  const addText = (text: string, size: number) => add({ type: 'text', text, size, font: fonts[0], color: '#ffffff' })

  async function openPhoto(file: File) {
    const src = URL.createObjectURL(file)
    try {
      const img = await loadImage(src)
      setPhoto({ src, w: img.naturalWidth, h: img.naturalHeight })
    } catch {
      URL.revokeObjectURL(src)
      alert('Could not open that image')
    }
  }

  function installFont(family: string) {
    setFonts((f) => [...new Set([family, ...f])])
    if (sel?.type === 'text') update(sel.id, { font: family })
  }

  async function exportPng() {
    if (!photo) return
    const url = URL.createObjectURL(await renderPng(photo.src, layers, mode === 'css'))
    const a = document.createElement('a')
    a.href = url
    a.download = 'edited.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function openPreview() {
    if (!photo) return
    setSelected(null)
    setPreview(URL.createObjectURL(await renderPng(photo.src, layers, mode === 'css')))
  }

  function closePreview() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
  }

  return (
    <div className="app">
      <aside>
        <h1>Photo Text</h1>
        <ModeTabs mode={mode} onChange={setMode} />
        <FileButton accept="image/*" onFile={openPhoto}>
          {photo ? 'Replace image' : 'Add image'}
        </FileButton>

        {photo && (
          <>
            <button onClick={() => setEditing(addText('Your text', 8))}>Add text</button>
            <StickerPicker onEmoji={(emoji) => addText(emoji, 12)} onImage={(src) => add({ type: 'image', src, size: 25 })} />
            <FontLoader onInstall={installFont} onDiscover={(found) => setFonts((f) => [...new Set([...f, ...found])])} />
            {sel && (
              <LayerProps
                layer={sel}
                fonts={fonts}
                onChange={(patch) => update(sel.id, patch)}
                onRemove={() => remove(sel.id)}
              />
            )}
            <p className="hint">Drag to move. Double-click text (or press Enter) to edit. Delete key removes.</p>
            <div className="actions">
              <button onClick={openPreview}>Before / after</button>
              <button className="primary" onClick={exportPng}>
                Export PNG
              </button>
            </div>
          </>
        )}
      </aside>

      <main role="tabpanel">
        {photo ? (
          <Stage
            mode={mode}
            photo={photo}
            layers={layers}
            selected={selected}
            editing={editing}
            onSelect={setSelected}
            onEdit={setEditing}
            onChange={update}
            onRemove={remove}
          />
        ) : (
          <p className="empty">Add an image to start.</p>
        )}
      </main>

      {photo && preview && (
        <BeforeAfter before={photo.src} after={preview} aspect={photo.w / photo.h} onClose={closePreview} />
      )}
    </div>
  )
}
