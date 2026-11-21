/** Millimetres to PDF points. 1 in = 25.4 mm = 72 pt. */
export const MM_TO_PT = 72 / 25.4

export const PAGE_MM = {
  A0: { width: 841, height: 1189 },
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
}

export const PRINT_MARGIN_MM = 10
export const TILE_OVERLAP_MM = 10
export const TILE_FOOTER_MM = 78

export function mmToPt(mm) {
  return mm * MM_TO_PT
}

/**
 * Tile a pattern (millimetres) onto a page, keeping every tile inside the
 * printable area. Overlap is shared by neighbouring tiles.
 */
export function planTiles(patternWidthMm, patternHeightMm, page) {
  const printableW = page.width - 2 * PRINT_MARGIN_MM
  const printableH = page.height - 2 * PRINT_MARGIN_MM
  const viewW = printableW
  const viewH = Math.max(20, printableH - TILE_FOOTER_MM)
  const stepX = Math.max(10, viewW - TILE_OVERLAP_MM)
  const stepY = Math.max(10, viewH - TILE_OVERLAP_MM)
  const cols = Math.max(1, Math.ceil((patternWidthMm - TILE_OVERLAP_MM) / stepX))
  const rows = Math.max(1, Math.ceil((patternHeightMm - TILE_OVERLAP_MM) / stepY))
  const tiles = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      tiles.push({
        row,
        col,
        rows,
        cols,
        index: row * cols + col + 1,
        count: rows * cols,
        originX: col * stepX,
        originY: row * stepY,
        viewW,
        viewH,
      })
    }
  }
  return { viewW, viewH, stepX, stepY, cols, rows, tiles }
}
