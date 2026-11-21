import {
  IDENTITY,
  apply,
  multiply,
  parseTransform,
  transformPath,
  translate,
  type Matrix,
} from '@/lib/svg-math.mjs'

export type FlatPath = { kind: 'path'; d: string; cls: string }
export type FlatMark = { kind: 'notch' | 'bnotch'; x: number; y: number }
export type FlatText = {
  kind: 'text'
  x: number
  y: number
  text: string
  sizeMm: number
  rotateDeg: number
  anchor: 'start' | 'middle' | 'end'
}
export type FlatItem = FlatPath | FlatMark | FlatText

export type FlatPattern = {
  widthMm: number
  heightMm: number
  items: FlatItem[]
}

function matrixOf(el: Element): Matrix {
  const chain: Element[] = []
  let current: Element | null = el
  while (current) {
    chain.push(current)
    current = current.parentElement
  }
  let matrix: Matrix = IDENTITY
  for (const node of chain.reverse()) {
    matrix = multiply(matrix, parseTransform(node.getAttribute('transform')))
    if (node.localName === 'use') {
      matrix = multiply(
        matrix,
        translate(Number(node.getAttribute('x') || 0), Number(node.getAttribute('y') || 0)),
      )
    }
  }
  return matrix
}

function fontMm(cls: string): number {
  if (cls.includes('text-4xl')) return 36
  if (cls.includes('text-xl')) return 9
  if (cls.includes('text-lg')) return 7
  if (cls.includes('text-sm')) return 4
  if (cls.includes('text-xs')) return 3
  return 5
}

function anchorOf(cls: string): FlatText['anchor'] {
  if (cls.includes('center')) return 'middle'
  if (cls.includes('right')) return 'end'
  return 'start'
}

export function flattenSvg(svgText: string): FlatPattern {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const svg = doc.documentElement
  const box = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number)
  const widthMm = box[2]
  const heightMm = box[3]
  if (!widthMm || !heightMm) throw new Error('The draft SVG has no viewBox, so it cannot be scaled.')
  const container = svg.querySelector('#fs-container')
  if (!container) throw new Error('The draft SVG has no pattern container.')

  const items: FlatItem[] = []
  const pathMatrix = new Map<string, Matrix>()

  container.querySelectorAll('path').forEach((path) => {
    const d = path.getAttribute('d')
    const cls = path.getAttribute('class') || ''
    if (!d || cls.split(/\s+/).includes('hidden')) return
    const matrix = matrixOf(path)
    const id = path.getAttribute('id')
    if (id) pathMatrix.set(id, matrix)
    items.push({ kind: 'path', d: transformPath(d, matrix), cls })
  })

  container.querySelectorAll('use').forEach((use) => {
    const href = use.getAttribute('href') || use.getAttribute('xlink:href') || ''
    const kind = href.endsWith('bnotch') ? 'bnotch' : href.endsWith('notch') ? 'notch' : null
    if (!kind) return
    const origin = apply(matrixOf(use), 0, 0)
    items.push({ kind, x: origin.x, y: origin.y })
  })

  container.querySelectorAll('text').forEach((text) => {
    const value = (text.textContent || '').replace(/\s+/g, ' ').trim()
    if (!value) return
    const cls = text.getAttribute('class') || ''
    const textPath = text.querySelector('textPath')
    let x = Number(text.getAttribute('x') || 0)
    let y = Number(text.getAttribute('y') || 0)
    let matrix = matrixOf(text)
    if (textPath) {
      const href = textPath.getAttribute('href') || textPath.getAttribute('xlink:href') || ''
      const id = href.startsWith('#') ? href.slice(1) : href
      const path = id ? svg.querySelector(`[id="${CSS.escape(id)}"]`) : null
      const pathM = pathMatrix.get(id)
      if (path instanceof SVGPathElement && pathM && typeof path.getTotalLength === 'function') {
        try {
          const point = path.getPointAtLength(path.getTotalLength() / 2)
          const placed = apply(pathM, point.x, point.y)
          x = placed.x
          y = placed.y
          matrix = IDENTITY
        } catch {
          return
        }
      } else {
        return
      }
    }
    const local = parseTransform(text.getAttribute('transform'))
    const scale = Math.hypot(local.a, local.b) || 1
    const placed = apply(matrix, x, y)
    const rotateDeg = (Math.atan2(local.b, local.a) * 180) / Math.PI
    items.push({
      kind: 'text',
      x: placed.x,
      y: placed.y,
      text: value,
      sizeMm: fontMm(cls) * scale,
      rotateDeg,
      anchor: anchorOf(cls),
    })
  })

  return { widthMm, heightMm, items }
}
