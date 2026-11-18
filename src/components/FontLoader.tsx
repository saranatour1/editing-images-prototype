import FileButton from './FileButton.tsx'

// Local Font Access API (Chrome/Edge only), not in TypeScript's DOM types.
declare global {
  interface Window {
    queryLocalFonts?: () => Promise<{ family: string }[]>
  }
}

type Props = { onInstall: (family: string) => void; onDiscover: (families: string[]) => void }

export default function FontLoader({ onInstall, onDiscover }: Props) {
  async function install(file: File) {
    const family = file.name.replace(/\.[^.]+$/, '')
    try {
      document.fonts.add(await new FontFace(family, await file.arrayBuffer()).load())
    } catch {
      return alert('Could not load that font file')
    }
    onInstall(family)
  }

  async function discover() {
    try {
      const local = (await window.queryLocalFonts?.()) ?? []
      onDiscover([...new Set(local.map((f) => f.family))])
    } catch {
      alert('Font access was blocked')
    }
  }

  return (
    <>
      <h2>Fonts</h2>
      <FileButton accept=".ttf,.otf,.woff,.woff2" onFile={install}>
        Install font file
      </FileButton>
      {window.queryLocalFonts && <button onClick={discover}>Discover system fonts</button>}
    </>
  )
}
