# Photo Text Editor

A small Vite + React + TypeScript prototype for putting text and stickers on a photo.

- Add a photo, then add text (double-click to edit in place), emoji stickers or image stickers.
- Drag items around; they can't leave the photo.
- Use built-in fonts, install a font file (.ttf/.otf/.woff/.woff2), or discover system fonts (Chrome/Edge).
- Before/after slider and PNG export at the photo's full resolution.
- Two tabs, same edit: **JavaScript** measures items while dragging to keep them in the photo; **CSS** does it with `translate: clamp()` (see `src/components/Stage.css`), even when you make an item bigger.

Positions are stored as % of the photo and sizes in `cqw` (container query width), so the layout scales with the photo and the export matches what you see.

```bash
npm install
npm run dev
```
