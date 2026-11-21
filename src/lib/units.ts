import { formatCentimetres, formatInches } from './fractions'

export type Unit = 'cm' | 'in'

export function fromMm(mm: number, unit: Unit): number {
  return unit === 'cm' ? mm / 10 : mm / 25.4
}

export function toMm(value: number, unit: Unit): number {
  return unit === 'cm' ? value * 10 : value * 25.4
}

export function formatLength(mm: number, unit: Unit): string {
  if (!Number.isFinite(mm)) return '—'
  const value = unit === 'in' ? formatInches(mm) : formatCentimetres(mm)
  return `${value} ${unit}`
}

export function formatMm(mm: number, digits = 1): string {
  if (!Number.isFinite(mm)) return '—'
  const rounded = Math.round(mm * 10 ** digits) / 10 ** digits
  return `${rounded} mm`
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  const factor = 10 ** digits
  const rounded = Math.round(value * factor) / factor
  const sign = rounded > 0 ? '+' : ''
  return `${sign}${rounded}%`
}

export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
