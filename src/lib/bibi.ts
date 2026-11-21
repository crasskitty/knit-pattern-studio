import { Bibi, i18n as bibiI18n } from '@freesewing/bibi'
import { i18n as annotationI18n } from '@freesewing/plugin-annotations'
import { i18nPlugin } from '@freesewing/plugin-i18n'
import { themePlugin } from '@freesewing/plugin-theme'
import { cisFemaleAdult38 } from '@freesewing/models'
import type { Unit } from './units'

export type OptionKind = 'pct' | 'bool' | 'list'

export type OptionSpec = {
  name: string
  kind: OptionKind
  min: number
  max: number
  pct: number
  bool: boolean
  dflt: string
  list: string[]
}

export type DraftResult = {
  svg: string
  widthMm: number
  heightMm: number
  openingMm: number
  neckFrontMm: number
  neckBackMm: number
  options: Record<string, number | boolean | string>
  absoluteOptions: Record<string, number>
  warnings: string[]
}

const EXPOSED = [
  'chestEase',
  'waistEase',
  'hipsEase',
  'seatEase',
  'fitWaist',
  'draftForHighBust',
  'bustEase',
  'sleeves',
  'sleeveLength',
  'cuffEase',
  'length',
  'lengthBonus',
  'flare',
  'necklineWidth',
  'necklineDepth',
  'necklineBend',
  'backNeckCutout',
  'backNeckBend',
  'strapWidth',
  'armholeCurveFront',
  'armholeCurveBack',
  'armholeDropBack',
  'useWaistRibbing',
  'useCuffRibbing',
  'ribbingStretch',
  'ribbingHeight',
  'bindingHeight',
] as const

function config() {
  if (Bibi.patternConfig) return Bibi.patternConfig
  return new Bibi().getConfig()
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object') return value as Record<string, unknown>
  return null
}

export function readOption(name: string): OptionSpec | null {
  const raw = asRecord(config().options[name])
  if (!raw) {
    if (typeof config().options[name] === 'number' || typeof config().options[name] === 'boolean') {
      return null
    }
    return null
  }
  if (Array.isArray(raw.list) && typeof raw.dflt === 'string') {
    return {
      name,
      kind: 'list',
      min: 0,
      max: 0,
      pct: 0,
      bool: false,
      dflt: raw.dflt,
      list: raw.list.filter((item): item is string => typeof item === 'string'),
    }
  }
  if (typeof raw.bool === 'boolean') {
    return {
      name,
      kind: 'bool',
      min: 0,
      max: 0,
      pct: 0,
      bool: raw.bool,
      dflt: '',
      list: [],
    }
  }
  if (typeof raw.pct === 'number') {
    return {
      name,
      kind: 'pct',
      min: typeof raw.min === 'number' ? raw.min : raw.pct,
      max: typeof raw.max === 'number' ? raw.max : raw.pct,
      pct: raw.pct,
      bool: false,
      dflt: '',
      list: [],
    }
  }
  return null
}

export function exposedOptions(): OptionSpec[] {
  return EXPOSED.map((name) => readOption(name)).filter((item): item is OptionSpec => item !== null)
}

export function missingExposedOptions(): string[] {
  return EXPOSED.filter((name) => readOption(name) === null)
}

export function requiredMeasurements(): string[] {
  return [...config().measurements]
}

export function optionalMeasurements(): string[] {
  return [...config().optionalMeasurements]
}

export function optionDefault(spec: OptionSpec): number | boolean | string {
  if (spec.kind === 'pct') return spec.pct
  if (spec.kind === 'bool') return spec.bool
  return spec.dflt
}

export function defaultOptions(): Record<string, number | boolean | string> {
  const options: Record<string, number | boolean | string> = {}
  for (const spec of exposedOptions()) options[spec.name] = optionDefault(spec)
  return options
}

export function clampOption(spec: OptionSpec, value: number | boolean | string): number | boolean | string {
  if (spec.kind === 'bool') return Boolean(value)
  if (spec.kind === 'list') {
    const text = String(value)
    return spec.list.includes(text) ? text : spec.dflt
  }
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return spec.pct
  return Math.min(spec.max, Math.max(spec.min, number))
}

export function chestEaseFloor(): number {
  return readOption('chestEase')?.min ?? -5
}

function translationTable(): Record<string, string> {
  const table: Record<string, string> = { ...annotationI18n.en }
  const parts = bibiI18n.en.p ?? {}
  for (const [key, value] of Object.entries(parts)) table[key] = value
  return table
}

export function exampleMeasurements(): Record<string, number> {
  const wanted = new Set([...requiredMeasurements(), ...optionalMeasurements()])
  const example: Record<string, number> = {}
  for (const [name, value] of Object.entries(cisFemaleAdult38)) {
    if (wanted.has(name) && typeof value === 'number') example[name] = value
  }
  return example
}

export function measurementIssues(
  measurements: Record<string, number | null>,
): { missing: string[]; message: string | null } {
  const missing = requiredMeasurements().filter((name) => {
    const value = measurements[name]
    if (value == null || !Number.isFinite(value)) return true
    if (name === 'shoulderSlope') return false
    return value <= 0
  })
  const seat = measurements.seat
  const seatBack = measurements.seatBack
  let message: string | null = null
  if (
    seat != null &&
    seatBack != null &&
    Number.isFinite(seat) &&
    Number.isFinite(seatBack) &&
    seatBack >= seat
  ) {
    message = 'Seat back has to be smaller than the full seat. Bibi uses seat minus seat back for the front.'
  }
  return { missing, message }
}

export function draftBibi(input: {
  measurements: Record<string, number | null>
  options: Record<string, number | boolean | string>
  saMm: number
  unit: Unit
}): DraftResult {
  const specs = exposedOptions()
  const freesewingOptions: Record<string, number | boolean | string> = {}
  for (const spec of specs) {
    const value = clampOption(spec, input.options[spec.name] ?? optionDefault(spec))
    freesewingOptions[spec.name] = spec.kind === 'pct' ? Number(value) / 100 : value
  }

  const measurements: Record<string, number> = {}
  for (const name of [...requiredMeasurements(), ...optionalMeasurements()]) {
    const value = input.measurements[name]
    if (value != null && Number.isFinite(value)) {
      if (name !== 'shoulderSlope' && value <= 0) continue
      measurements[name] = value
    }
  }

  const pattern = new Bibi({
    sa: input.saMm,
    complete: true,
    paperless: false,
    units: input.unit === 'in' ? 'imperial' : 'metric',
    measurements,
    options: freesewingOptions,
    metadata: { setName: 'Ashley Neale' },
  })
  pattern.use(themePlugin)
  pattern.use(i18nPlugin, { en: translationTable() })
  const svg = pattern.draft().render()
  const store = pattern.setStores[0]
  const neckFrontMm = Number(store?.get('neckSizeFront') ?? 0)
  const neckBackMm = Number(store?.get('neckSizeBack') ?? 0)
  const logs = pattern.getLogs()
  const warnings = [...(logs.sets?.[0]?.warn ?? []), ...(logs.pattern?.warn ?? [])].filter(
    (line) => !line.startsWith('Store.'),
  )

  return {
    svg,
    widthMm: pattern.width,
    heightMm: pattern.height,
    openingMm: 2 * (neckFrontMm + neckBackMm),
    neckFrontMm,
    neckBackMm,
    options: pattern.settings[0]?.options ?? {},
    absoluteOptions: pattern.settings[0]?.absoluteOptions ?? {},
    warnings,
  }
}

export function appliedPercent(result: DraftResult, name: string): number | null {
  const value = result.options[name]
  return typeof value === 'number' ? value * 100 : null
}
