declare module '@/lib/scale.mjs' {
  export const MM_TO_PT: number
  export const PRINT_MARGIN_MM: number
  export const TILE_OVERLAP_MM: number
  export const TILE_FOOTER_MM: number
  export const PAGE_MM: {
    A0: { width: number; height: number }
    A4: { width: number; height: number }
    Letter: { width: number; height: number }
  }
  export function mmToPt(mm: number): number
  export function planTiles(
    patternWidthMm: number,
    patternHeightMm: number,
    page: { width: number; height: number },
  ): {
    viewW: number
    viewH: number
    stepX: number
    stepY: number
    cols: number
    rows: number
    tiles: Array<{
      row: number
      col: number
      rows: number
      cols: number
      index: number
      count: number
      originX: number
      originY: number
      viewW: number
      viewH: number
    }>
  }
}

declare module '@/lib/svg-math.mjs' {
  export const IDENTITY: Matrix
  export type Matrix = { a: number; b: number; c: number; d: number; e: number; f: number }
  export function multiply(m: Matrix, n: Matrix): Matrix
  export function translate(x: number, y: number): Matrix
  export function parseTransform(text: string | null): Matrix
  export function apply(m: Matrix, x: number, y: number): { x: number; y: number }
  export function transformPath(d: string, matrix: Matrix): string
  export function pathBounds(
    d: string,
  ): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } | null
}

type Matrix = { a: number; b: number; c: number; d: number; e: number; f: number }
