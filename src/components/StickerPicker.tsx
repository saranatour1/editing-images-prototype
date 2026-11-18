import { loadImage } from '../lib/canvas.ts'
import FileButton from './FileButton.tsx'
import './StickerPicker.css'

const STICKERS = ['😎', '🔥', '❤️', '⭐', '🎉', '👍', '😂', '✨']

type Props = { onEmoji: (emoji: string) => void; onImage: (src: string) => void }

export default function StickerPicker({ onEmoji, onImage }: Props) {
  async function addImage(file: File) {
    const src = URL.createObjectURL(file)
    try {
      await loadImage(src)
      onImage(src)
    } catch {
      URL.revokeObjectURL(src)
      alert('Could not open that image')
    }
  }

  return (
    <>
      <h2>Stickers</h2>
      <div className="stickers">
        {STICKERS.map((s) => (
          <button key={s} onClick={() => onEmoji(s)} aria-label={`Add ${s} sticker`}>
            {s}
          </button>
        ))}
      </div>
      <FileButton accept="image/*" onFile={addImage}>
        Image sticker
      </FileButton>
    </>
  )
}
