export type Photo = { src: string; w: number; h: number }

// x/y are % of the photo, size is % of the photo's width, so layers scale with the photo.
type Placement = { id: number; x: number; y: number; size: number }

export type TextLayer = Placement & { type: 'text'; text: string; font: string; color: string }
export type ImageLayer = Placement & { type: 'image'; src: string }
export type Layer = TextLayer | ImageLayer

export type NewLayer = Omit<TextLayer, 'id' | 'x' | 'y'> | Omit<ImageLayer, 'id' | 'x' | 'y'>
export type LayerPatch = Partial<Omit<TextLayer, 'id' | 'type'>>
