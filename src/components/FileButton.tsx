import type { ReactNode } from 'react'

type Props = { accept: string; onFile: (file: File) => void; children: ReactNode }

export default function FileButton({ accept, onFile, children }: Props) {
  return (
    <label className="btn">
      {children}
      <input
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = '' // allow picking the same file again
          if (file) onFile(file)
        }}
      />
    </label>
  )
}
