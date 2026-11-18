import { useEffect, useRef, useState } from 'react'

const FONTS = ['Arial', 'Impact', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS', 'Comic Sans MS']
const STICKERS = ['😎', '🔥', '❤️', '⭐', '🎉', '👍', '😂', '✨']
const LINE_HEIGHT = 1.2 // must match .layer line-height in index.css, export relies on it
const family = (f) => `"${f}", sans-serif`
const clamp = (v, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi))
const loadImg = (src) => {
  const img = new Image()
  img.src = src
  return img.decode().then(() => img)
}
const toBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
const pick = (fn) => (e) => {
  fn(e.target.files[0])
  e.target.value = '' // allow picking the same file again
}
let nextId = 1

export default function App() {
  const [photo, setPhoto] = useState(null) // { src, w, h }
  const [layers, setLayers] = useState([]) // x/y = % of photo, size = % of photo width
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [fonts, setFonts] = useState(FONTS)
  const [preview, setPreview] = useState(null)
  const [split, setSplit] = useState(50)
  const stageRef = useRef(null)

  const sel = layers.find((l) => l.id === selected)
  const update = (id, patch) => setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const remove = (id) => {
    setLayers((ls) => ls.filter((l) => l.id !== id))
    setSelected(null)
  }
  const add = (layer) => {
    const id = nextId++
    setLayers((ls) => [...ls, { id, x: 50, y: 50, font: fonts[0], color: '#ffffff', ...layer }])
    setSelected(id)
    return id
  }

  async function openPhoto(file) {
    if (!file) return
    const src = URL.createObjectURL(file)
    try {
      const img = await loadImg(src)
      setPhoto({ src, w: img.naturalWidth, h: img.naturalHeight })
    } catch {
      alert('Could not open that image')
    }
  }

  async function addImageSticker(file) {
    if (!file) return
    const src = URL.createObjectURL(file)
    try {
      await loadImg(src)
      add({ type: 'image', src, size: 25 })
    } catch {
      alert('Could not open that image')
    }
  }

  async function uploadFont(file) {
    if (!file) return
    const name = file.name.replace(/\.[^.]+$/, '')
    try {
      document.fonts.add(await new FontFace(name, await file.arrayBuffer()).load())
    } catch {
      return alert('Could not load that font file')
    }
    setFonts((f) => [...new Set([name, ...f])])
    if (sel?.type === 'text') update(sel.id, { font: name })
  }

  async function discoverFonts() {
    try {
      const local = await window.queryLocalFonts()
      setFonts((f) => [...new Set([...f, ...local.map((x) => x.family)])])
    } catch {
      alert('Font access was blocked')
    }
  }

  // Pointer drag, clamped so the layer's box never leaves the photo.
  function startDrag(e, layer) {
    e.stopPropagation()
    setSelected(layer.id)
    if (editing === layer.id) return
    const el = e.currentTarget
    const box = el.getBoundingClientRect()
    const stage = stageRef.current.getBoundingClientRect()
    const dx = e.clientX - (box.left + box.width / 2)
    const dy = e.clientY - (box.top + box.height / 2)
    el.setPointerCapture(e.pointerId)
    el.onpointermove = (ev) => {
      const x = clamp(ev.clientX - dx - stage.left, box.width / 2, stage.width - box.width / 2)
      const y = clamp(ev.clientY - dy - stage.top, box.height / 2, stage.height - box.height / 2)
      update(layer.id, { x: (x / stage.width) * 100, y: (y / stage.height) * 100 })
    }
    el.onpointerup = () => (el.onpointermove = el.onpointerup = null)
  }

  function finishEdit(e, layer) {
    const text = e.currentTarget.innerText.replace(/\n$/, '')
    setEditing(null)
    if (text.trim()) update(layer.id, { text })
    else remove(layer.id)
  }

  // Draw the photo at full resolution, then every layer using the same % math as the CSS.
  async function renderCanvas() {
    const base = await loadImg(photo.src)
    const canvas = document.createElement('canvas')
    canvas.width = base.naturalWidth
    canvas.height = base.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(base, 0, 0)
    for (const l of layers) {
      const x = (l.x / 100) * canvas.width
      const y = (l.y / 100) * canvas.height
      const s = (l.size / 100) * canvas.width
      if (l.type === 'image') {
        const img = await loadImg(l.src)
        const h = (s * img.naturalHeight) / img.naturalWidth
        ctx.drawImage(img, x - s / 2, y - h / 2, s, h)
        continue
      }
      ctx.font = `${s}px ${family(l.font)}`
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
    return canvas
  }

  async function exportPng() {
    const url = URL.createObjectURL(await toBlob(await renderCanvas()))
    const a = document.createElement('a')
    a.href = url
    a.download = 'edited.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function openPreview() {
    setSelected(null)
    setPreview(URL.createObjectURL(await toBlob(await renderCanvas())))
  }

  function closePreview() {
    URL.revokeObjectURL(preview)
    setPreview(null)
  }

  useEffect(() => {
    const el = editing && document.querySelector(`[data-id="${editing}"]`)
    if (!el) return
    el.focus()
    getSelection().selectAllChildren(el)
  }, [editing])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setPreview((p) => (p && URL.revokeObjectURL(p), null))
      if (!selected || editing || e.target.isContentEditable || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setLayers((ls) => ls.filter((l) => l.id !== selected))
        setSelected(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, editing])

  return (
    <div className="app">
      <aside>
        <h1>Photo Text</h1>
        <label className="btn">
          {photo ? 'Replace image' : 'Add image'}
          <input type="file" accept="image/*" hidden onChange={pick(openPhoto)} />
        </label>

        {photo && (
          <>
            <button onClick={() => setEditing(add({ type: 'text', text: 'Your text', size: 8 }))}>Add text</button>

            <h2>Stickers</h2>
            <div className="stickers">
              {STICKERS.map((s) => (
                <button key={s} onClick={() => add({ type: 'text', text: s, size: 12 })} aria-label={`Add ${s} sticker`}>
                  {s}
                </button>
              ))}
            </div>
            <label className="btn">
              Image sticker
              <input type="file" accept="image/*" hidden onChange={pick(addImageSticker)} />
            </label>

            <h2>Fonts</h2>
            <label className="btn">
              Install font file
              <input type="file" accept=".ttf,.otf,.woff,.woff2" hidden onChange={pick(uploadFont)} />
            </label>
            {'queryLocalFonts' in window && <button onClick={discoverFonts}>Discover system fonts</button>}

            {sel && (
              <div className="props">
                <h2>Selected</h2>
                {sel.type === 'text' && (
                  <>
                    <label>
                      Font
                      <select value={sel.font} onChange={(e) => update(sel.id, { font: e.target.value })}>
                        {fonts.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Color
                      <input type="color" value={sel.color} onChange={(e) => update(sel.id, { color: e.target.value })} />
                    </label>
                  </>
                )}
                <label>
                  Size
                  <input
                    type="range"
                    min="1"
                    max={sel.type === 'image' ? 100 : 40}
                    step="0.5"
                    value={sel.size}
                    onChange={(e) => update(sel.id, { size: +e.target.value })}
                  />
                </label>
                <button className="danger" onClick={() => remove(sel.id)}>
                  Delete
                </button>
              </div>
            )}

            <p className="hint">Drag to move. Double-click text to edit. Delete key removes.</p>
            <div className="actions">
              <button onClick={openPreview}>Before / after</button>
              <button className="primary" onClick={exportPng}>
                Export PNG
              </button>
            </div>
          </>
        )}
      </aside>

      <main>
        {photo ? (
          <div
            ref={stageRef}
            className="stage"
            style={{ '--ar': photo.w / photo.h }}
            onPointerDown={() => setSelected(null)}
          >
            <img src={photo.src} alt="Photo being edited" />
            {layers.map((l) => (
              <div
                key={`${l.id}:${l.text}`} // remount after an edit so React never fights the contentEditable DOM
                data-id={l.id}
                className={l.id === selected ? 'layer selected' : 'layer'}
                style={{ left: `${l.x}%`, top: `${l.y}%`, fontSize: `${l.size}cqw`, fontFamily: family(l.font), color: l.color }}
                contentEditable={editing === l.id ? 'plaintext-only' : undefined}
                suppressContentEditableWarning
                onPointerDown={(e) => startDrag(e, l)}
                onDoubleClick={() => l.type === 'text' && setEditing(l.id)}
                onBlur={(e) => editing === l.id && finishEdit(e, l)}
                onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
              >
                {l.type === 'image' ? <img src={l.src} alt="" draggable={false} style={{ width: `${l.size}cqw` }} /> : l.text}
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">Add an image to start.</p>
        )}
      </main>

      {preview && (
        <div className="modal" onClick={closePreview}>
          <div className="compare" style={{ '--ar': photo.w / photo.h }} onClick={(e) => e.stopPropagation()}>
            <img src={preview} alt="After" />
            <img src={photo.src} alt="Before" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
            <div className="divider" style={{ left: `${split}%` }} />
            <span className="tag before">Before</span>
            <span className="tag after">After</span>
            <input
              type="range"
              min="0"
              max="100"
              value={split}
              onChange={(e) => setSplit(+e.target.value)}
              aria-label="Before and after split"
            />
          </div>
          <button onClick={closePreview}>Close</button>
        </div>
      )}
    </div>
  )
}
