import { useState, type CSSProperties } from 'react'
import './BeforeAfter.css'

type Props = { before: string; after: string; aspect: number; onClose: () => void }

// Ref callback instead of an effect; the native <dialog> handles Escape, focus and the backdrop.
const showModal = (el: HTMLDialogElement | null) => {
  if (el && !el.open) el.showModal()
}

export default function BeforeAfter({ before, after, aspect, onClose }: Props) {
  const [split, setSplit] = useState(50)

  return (
    <dialog
      ref={showModal}
      className="before-after"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
    >
      <div className="compare" style={{ '--ar': aspect } as CSSProperties}>
        <img src={after} alt="After" />
        <img src={before} alt="Before" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
        <div className="divider" style={{ left: `${split}%` }} />
        <span className="tag before">Before</span>
        <span className="tag after">After</span>
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(e) => setSplit(+e.target.value)}
          aria-label="Before and after split"
        />
      </div>
      <form method="dialog">
        <button>Close</button>
      </form>
    </dialog>
  )
}
