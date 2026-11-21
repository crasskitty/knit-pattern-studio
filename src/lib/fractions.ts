import type { Unit } from './units'

const INCH_MM = 25.4

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y) {
    const t = y
    y = x % y
    x = t
  }
  return x || 1
}

/** Store lengths to 0.001 mm so a displayed fraction and its millimetres agree. */
export function canonMm(mm: number): number {
  return Math.round(mm * 1000) / 1000
}

export function parseInches(text: string): number | null {
  const t = text.trim()
  if (!t) return null
  let match = t.match(/^(-?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)\s*$/)
  if (match) {
    const sign = match[1] === '-' ? -1 : 1
    const denom = Number(match[4])
    if (denom === 0) return null
    return sign * (Number(match[2]) + Number(match[3]) / denom)
  }
  match = t.match(/^(-?)\s*(\d+)\s*-\s*(\d+)\s*\/\s*(\d+)\s*$/)
  if (match) {
    const sign = match[1] === '-' ? -1 : 1
    const denom = Number(match[4])
    if (denom === 0) return null
    return sign * (Number(match[2]) + Number(match[3]) / denom)
  }
  match = t.match(/^(-?)\s*(\d+)\s*\/\s*(\d+)\s*$/)
  if (match) {
    const sign = match[1] === '-' ? -1 : 1
    const denom = Number(match[3])
    if (denom === 0) return null
    return sign * (Number(match[2]) / denom)
  }
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t)
  return null
}

export function parseCentimetres(text: string): number | null {
  const t = text.trim()
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null
  return Number(t)
}

export function parseLengthToMm(text: string, unit: Unit): number | null {
  const value = unit === 'in' ? parseInches(text) : parseCentimetres(text)
  if (value == null || !Number.isFinite(value)) return null
  return canonMm(unit === 'in' ? value * INCH_MM : value * 10)
}

export function formatInches(mm: number): string {
  const inches = mm / INCH_MM
  const sign = inches < 0 ? '-' : ''
  const abs = Math.abs(inches)
  const whole = Math.floor(abs + 1e-8)
  const fraction = abs - whole
  for (const denom of [2, 4, 8, 16, 32]) {
    const numer = Math.round(fraction * denom)
    if (Math.abs(fraction - numer / denom) > 0.0008) continue
    if (numer === 0) return `${sign}${whole || 0}`
    if (numer === denom) return `${sign}${whole + 1}`
    const divisor = gcd(numer, denom)
    const frac = `${numer / divisor}/${denom / divisor}`
    return whole === 0 ? `${sign}${frac}` : `${sign}${whole} ${frac}`
  }
  const rounded = Math.round(abs * 1000) / 1000
  return `${sign}${rounded}`
}

export function formatCentimetres(mm: number): string {
  const cm = mm / 10
  const rounded = Math.round(cm * 10000) / 10000
  return String(rounded)
}

export function formatLengthValue(mm: number, unit: Unit): string {
  if (!Number.isFinite(mm)) return ''
  return unit === 'in' ? formatInches(mm) : formatCentimetres(mm)
}
