import {
  PDFDocument,
  StandardFonts,
  clip,
  degrees,
  endPath,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
} from 'pdf-lib'
import { MM_TO_PT, PAGE_MM, PRINT_MARGIN_MM, TILE_FOOTER_MM, TILE_OVERLAP_MM, mmToPt, planTiles } from '@/lib/scale.mjs'
import type { FlatItem, FlatPattern } from './flatten-svg'
import { formatLength, type Unit } from './units'

export type Paper = 'A0' | 'A4' | 'Letter'

const INK = rgb(0.12, 0.1, 0.08)
const FABRIC = rgb(0.13, 0.13, 0.13)
const SA = rgb(0.35, 0.35, 0.35)
const NOTE = rgb(0.42, 0.28, 0.62)
const HELP = rgb(0.4, 0.42, 0.45)
const VARIOUS = rgb(0.75, 0.22, 0.2)

function strokeFor(cls: string, thick: boolean, dark: boolean): { color: ReturnType<typeof rgb>; width: number; dash?: number[] } | null {
  if (cls.split(/\s+/).includes('hidden')) return null
  let color = dark ? rgb(0.93, 0.91, 0.86) : INK
  let width = thick ? 0.9 : 0.3
  let dash: number[] | undefined
  if (cls.includes('fabric')) {
    color = dark ? rgb(0.96, 0.94, 0.9) : FABRIC
    width = thick ? 1.6 : 0.55
  }
  if (cls.includes('various')) {
    color = dark ? rgb(1, 0.55, 0.5) : VARIOUS
    width = thick ? 1.2 : 0.45
  }
  if (cls.includes('note') || cls.includes('mark')) {
    color = NOTE
    width = 0.3
  }
  if (cls.includes('help')) {
    color = HELP
    width = 0.2
    dash = [8, 1.5, 0.8, 1.5]
  }
  if (cls.includes('sa')) {
    color = SA
    dash = [0.8, 1.1]
  } else if (cls.includes('dashed')) dash = [0.8, 1.1]
  return { color, width, dash }
}

function drawPattern(
  page: ReturnType<PDFDocument['addPage']>,
  flat: FlatPattern,
  originX: number,
  originY: number,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  look: { thick: boolean; dark: boolean } = { thick: false, dark: false },
) {
  const pageHeight = page.getHeight()
  const margin = mmToPt(PRINT_MARGIN_MM)
  const x0 = margin - originX * MM_TO_PT
  const y0 = pageHeight - margin + originY * MM_TO_PT

  for (const item of flat.items) {
    if (item.kind === 'path') {
      const stroke = strokeFor(item.cls, look.thick, look.dark)
      if (!stroke) continue
      page.drawSvgPath(item.d, {
        x: x0,
        y: y0,
        scale: MM_TO_PT,
        borderColor: stroke.color,
        borderWidth: stroke.width,
        borderDashArray: stroke.dash,
      })
    } else if (item.kind === 'notch' || item.kind === 'bnotch') {
      const x = margin + (item.x - originX) * MM_TO_PT
      const y = pageHeight - margin - (item.y - originY) * MM_TO_PT
      page.drawCircle({ x, y, size: mmToPt(2.6), borderColor: NOTE, borderWidth: 0.6 })
      if (item.kind === 'bnotch') {
        const d = mmToPt(1.3)
        page.drawLine({ start: { x: x - d, y: y - d }, end: { x: x + d, y: y + d }, thickness: 0.6, color: NOTE })
        page.drawLine({ start: { x: x - d, y: y + d }, end: { x: x + d, y: y - d }, thickness: 0.6, color: NOTE })
      }
    } else if (item.kind === 'text') {
      drawLabel(page, item, originX, originY, font, look.dark ? rgb(0.95, 0.93, 0.88) : INK)
    }
  }
}

function drawLabel(
  page: ReturnType<PDFDocument['addPage']>,
  item: Extract<FlatItem, { kind: 'text' }>,
  originX: number,
  originY: number,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  color: ReturnType<typeof rgb> = INK,
) {
  const pageHeight = page.getHeight()
  const margin = mmToPt(PRINT_MARGIN_MM)
  const size = Math.max(4, Math.min(28, item.sizeMm * MM_TO_PT))
  const label = winAnsi(item.text)
  const width = font.widthOfTextAtSize(label, size)
  let dx = 0
  if (item.anchor === 'middle') dx = -width / 2
  if (item.anchor === 'end') dx = -width
  const rad = (-item.rotateDeg * Math.PI) / 180
  const x = margin + (item.x - originX) * MM_TO_PT + dx * Math.cos(rad)
  const y = pageHeight - margin - (item.y - originY) * MM_TO_PT + dx * Math.sin(rad)
  page.drawText(label, {
    x,
    y,
    size,
    font,
    color,
    rotate: degrees(-item.rotateDeg),
  })
}

function drawSquares(
  page: ReturnType<PDFDocument['addPage']>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
) {
  const margin = mmToPt(PRINT_MARGIN_MM)
  const y = margin
  const five = mmToPt(50)
  const twoInch = 2 * 72
  page.drawRectangle({
    x: margin,
    y,
    width: five,
    height: five,
    borderColor: INK,
    borderWidth: 0.9,
  })
  page.drawText('5 cm square', {
    x: margin,
    y: y + five + 3,
    size: 8,
    font,
    color: INK,
  })
  const x2 = margin + five + mmToPt(8)
  page.drawRectangle({
    x: x2,
    y,
    width: twoInch,
    height: twoInch,
    borderColor: INK,
    borderWidth: 0.9,
  })
  page.drawText('2 in square', {
    x: x2,
    y: y + twoInch + 3,
    size: 8,
    font,
    color: INK,
  })
}

function drawMap(
  page: ReturnType<PDFDocument['addPage']>,
  tile: { row: number; col: number; rows: number; cols: number },
) {
  const cell = 7
  const gap = 1.5
  const mapW = tile.cols * cell + (tile.cols - 1) * gap
  const mapH = tile.rows * cell + (tile.rows - 1) * gap
  const x0 = page.getWidth() - mmToPt(PRINT_MARGIN_MM) - mapW
  const y0 = mmToPt(PRINT_MARGIN_MM)
  for (let row = 0; row < tile.rows; row++) {
    for (let col = 0; col < tile.cols; col++) {
      const here = row === tile.row && col === tile.col
      const x = x0 + col * (cell + gap)
      const y = y0 + (tile.rows - 1 - row) * (cell + gap)
      page.drawRectangle({
        x,
        y,
        width: cell,
        height: cell,
        color: here ? INK : undefined,
        borderColor: INK,
        borderWidth: 0.6,
      })
    }
  }
  return { mapW, mapH, y0 }
}

function drawRegistration(
  page: ReturnType<PDFDocument['addPage']>,
  tile: { originX: number; originY: number; viewW: number; viewH: number; row: number; col: number; rows: number; cols: number },
) {
  const margin = mmToPt(PRINT_MARGIN_MM)
  const pageH = page.getHeight()
  const left = margin
  const right = margin + mmToPt(tile.viewW)
  const top = pageH - margin
  const bottom = pageH - margin - mmToPt(tile.viewH)
  const corners = [
    [left, top],
    [right, top],
    [left, bottom],
    [right, bottom],
  ]
  const arm = mmToPt(4)
  for (const [x, y] of corners) {
    page.drawLine({ start: { x: x - arm, y }, end: { x: x + arm, y }, thickness: 0.4, color: INK })
    page.drawLine({ start: { x, y: y - arm }, end: { x, y: y + arm }, thickness: 0.4, color: INK })
  }
  void tile
}

export async function buildTiledPdf(flat: FlatPattern, paper: Paper, unit: Unit = 'in'): Promise<Uint8Array> {
  const pageMm = PAGE_MM[paper]
  const plan = planTiles(flat.widthMm, flat.heightMm, pageMm)
  const doc = await PDFDocument.create()
  doc.setTitle(`Bibi body block, ${paper}, 1:1`)
  doc.setAuthor('Knit Pattern Studio')
  doc.setSubject('Print at 100% / actual size. FreeSewing Bibi 4.10.2.')
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  for (const tile of plan.tiles) {
    const page = doc.addPage([mmToPt(pageMm.width), mmToPt(pageMm.height)])
    const margin = mmToPt(PRINT_MARGIN_MM)
    const footer = mmToPt(TILE_FOOTER_MM)
    const viewW = mmToPt(tile.viewW)
    const viewH = mmToPt(tile.viewH)
    page.pushOperators(
      pushGraphicsState(),
      rectangle(margin, margin + footer, viewW, viewH),
      clip(),
      endPath(),
    )
    drawPattern(page, flat, tile.originX, tile.originY, font)
    page.pushOperators(popGraphicsState())
    drawRegistration(page, tile)
    drawSquares(page, font)
    drawMap(page, tile)
    const labelY = margin + footer - 12
    page.drawText('Print at 100% / actual size. Do not fit or scale.', {
      x: margin,
      y: labelY,
      size: 9,
      font: bold,
      color: INK,
    })
    page.drawText(
      `${paper} tile ${tile.index} of ${tile.count} · row ${tile.row + 1} of ${tile.rows}, column ${tile.col + 1} of ${tile.cols} · ${formatLength(TILE_OVERLAP_MM, unit)} overlap`,
      { x: margin, y: labelY - 12, size: 8, font, color: INK },
    )
  }

  return doc.save()
}

function winAnsi(text: string) {
  return text.replace(/[^\u0020-\u007E]/g, ' ')
}

export async function buildProjectorPdf(
  flat: FlatPattern,
  theme: 'light' | 'dark',
  unit: Unit,
): Promise<Uint8Array> {
  const margin = 50
  const bottom = 90
  const pageW = flat.widthMm + margin * 2
  const pageH = flat.heightMm + margin + bottom
  const dark = theme === 'dark'
  const ink = dark ? rgb(0.95, 0.93, 0.88) : INK
  const paper = dark ? rgb(0.1, 0.1, 0.12) : rgb(1, 1, 1)
  const grid = dark ? rgb(0.35, 0.34, 0.32) : rgb(0.75, 0.72, 0.66)
  const doc = await PDFDocument.create()
  doc.setTitle('Projector pattern, 1:1')
  doc.setSubject('Project at 100% / actual size.')
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([mmToPt(pageW), mmToPt(pageH)])
  page.drawRectangle({ x: 0, y: 0, width: page.getWidth(), height: page.getHeight(), color: paper })
  const step = unit === 'in' ? 25.4 : 50
  const pageTop = page.getHeight() - mmToPt(margin)
  for (let x = 0; x <= flat.widthMm + 0.01; x += step) {
    const px = mmToPt(margin + x)
    page.drawLine({
      start: { x: px, y: mmToPt(bottom) },
      end: { x: px, y: pageTop },
      thickness: 0.6,
      color: grid,
    })
  }
  for (let y = 0; y <= flat.heightMm + 0.01; y += step) {
    const py = pageTop - mmToPt(y)
    page.drawLine({
      start: { x: mmToPt(margin), y: py },
      end: { x: mmToPt(margin + flat.widthMm), y: py },
      thickness: 0.6,
      color: grid,
    })
  }
  drawPattern(page, flat, PRINT_MARGIN_MM - margin, PRINT_MARGIN_MM - margin, font, { thick: true, dark })
  const squareInk = dark ? rgb(0.95, 0.93, 0.88) : INK
  const five = mmToPt(50)
  const twoInch = 144
  const y = mmToPt(12)
  page.drawRectangle({ x: mmToPt(margin), y, width: five, height: five, borderColor: squareInk, borderWidth: 1.4 })
  page.drawText('5 cm square', { x: mmToPt(margin), y: y + five + 4, size: 14, font: bold, color: squareInk })
  page.drawRectangle({
    x: mmToPt(margin) + five + mmToPt(12),
    y,
    width: twoInch,
    height: twoInch,
    borderColor: squareInk,
    borderWidth: 1.4,
  })
  page.drawText('2 in square', {
    x: mmToPt(margin) + five + mmToPt(12),
    y: y + twoInch + 4,
    size: 14,
    font: bold,
    color: squareInk,
  })
  page.drawText(`Project at 100% / actual size. Grid is ${unit === 'in' ? '1 in' : '5 cm'}.`, {
    x: mmToPt(margin),
    y: mmToPt(bottom) - 16,
    size: 16,
    font: bold,
    color: ink,
  })
  return doc.save()
}
