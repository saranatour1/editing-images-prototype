import type { ContainMode } from '../types.ts'
import './ModeTabs.css'

const TABS: { mode: ContainMode; label: string; hint: string }[] = [
  {
    mode: 'js',
    label: 'JavaScript',
    hint: "JavaScript measures each item while you drag and stops it at the photo's edge. Making an item bigger can still push it past the edge.",
  },
  {
    mode: 'css',
    label: 'CSS',
    hint: "CSS keeps items inside: translate: clamp() stops each box at the photo's edges, even when you make it bigger. JavaScript only tracks the pointer.",
  },
]

type Props = { mode: ContainMode; onChange: (mode: ContainMode) => void }

export default function ModeTabs({ mode, onChange }: Props) {
  return (
    <>
      <div className="tabs" role="tablist" aria-label="Keep items inside the photo with">
        {TABS.map((t) => (
          <button key={t.mode} role="tab" aria-selected={mode === t.mode} onClick={() => onChange(t.mode)}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="hint">{TABS.find((t) => t.mode === mode)?.hint}</p>
    </>
  )
}
