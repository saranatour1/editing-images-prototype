# Photo Text Editor

A small Vite + React prototype for putting text and stickers on a photo.

- Add a photo, then add text (double-click to edit in place), emoji stickers or image stickers.
- Drag items around; they can't leave the photo.
- Use built-in fonts, install a font file (.ttf/.otf/.woff/.woff2), or discover system fonts (Chrome/Edge).
- Before/after slider and PNG export at the photo's full resolution.

Positions are stored as % of the photo and sizes in `cqw` (container query width), so the layout scales with the photo and the export matches what you see.

```bash
npm install
npm run dev
```
