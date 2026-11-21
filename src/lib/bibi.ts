import { Bibi, i18n as bibiI18n } from '@freesewing/bibi'
import { Lily, i18n as lilyI18n } from '@freesewing/lily'
import { Shelly, i18n as shellyI18n } from '@freesewing/shelly'
import { i18n as annotationI18n } from '@freesewing/plugin-annotations'
import { i18nPlugin } from '@freesewing/plugin-i18n'
import { themePlugin } from '@freesewing/plugin-theme'
import { cisFemaleAdult38 } from '@freesewing/models'
import { VERTICAL_MEASUREMENTS, verticalReduction, type VerticalReduction } from './ease'
import type { Unit } from './units'

export type DesignId = 'bibi' | 'shelly' | 'lily'

export const DESIGNS: { id: DesignId; title: string; blurb: string }[] = [
  { id: 'bibi', title: 'Bibi', blurb: 'Knit top block' },
  { id: 'shelly', title: 'Shelly', blurb: 'Raglan shirt' },
  { id: 'lily', title: 'Lily', blurb: 'Leggings' },
]

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

export type LengthChange = { name: string; originalMm: number; appliedMm: number }

export type DraftResult = {
  svg: string
  widthMm: number
  heightMm: number
  openingMm: number
  neckFrontMm: number
  neckBackMm: number
  neckSideMm: number
  openingLabel: string
  options: Record<string, number | boolean | string>
  absoluteOptions: Record<string, number>
  warnings: string[]
  reduction: VerticalReduction
  lengths: LengthChange[]
}

const EXPOSED: Record<DesignId, string[]> = {
  bibi: [
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
  ],
  shelly: [
    'chestEase',
    'hipsEase',
    'neckEase',
    'neckBalance',
    'armpitEase',
    'sleeveEase',
    'wristEase',
    'straightSides',
    'bodyLength',
    'sleeveLength',
    'neckbandLength',
    'neckbandWidth',
    'hemWidth',
    'sleeveHem',
    'sideShape',
    'raglanScoopLength',
    'raglanScoopMagnitude',
  ],
  lily: ['fabricStretch', 'waistEase', 'seatEase', 'kneeEase', 'waistHeight', 'waistbandWidth'],
}

const EASE_COMPARE: Record<DesignId, 'fittedTop' | 'leggings'> = {
  bibi: 'fittedTop',
  shelly: 'fittedTop',
  lily: 'leggings',
}

const CONSTRUCTORS = { bibi: Bibi, shelly: Shelly, lily: Lily }

function config(design: DesignId = 'bibi') {
  const ctor = CONSTRUCTORS[design]
  if (ctor.patternConfig) return ctor.patternConfig
  return new ctor().getConfig()
}

export function easeBandFor(design: DesignId): 'fittedTop' | 'leggings' {
  return EASE_COMPARE[design]
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object') return value as Record<string, unknown>
  return null
}

export function readOption(name: string, design: DesignId = 'bibi'): OptionSpec | null {
  const raw = asRecord(config(design).options[name])
  if (!raw) return null
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

export function exposedOptions(design: DesignId = 'bibi'): OptionSpec[] {
  return EXPOSED[design]
    .map((name) => readOption(name, design))
    .filter((item): item is OptionSpec => item !== null)
}

export function missingExposedOptions(design: DesignId = 'bibi'): string[] {
  return EXPOSED[design].filter((name) => readOption(name, design) === null)
}

export function requiredMeasurements(design: DesignId = 'bibi'): string[] {
  return [...config(design).measurements]
}

export function optionalMeasurements(design: DesignId = 'bibi'): string[] {
  return [...(config(design).optionalMeasurements ?? [])]
}

export function optionDefault(spec: OptionSpec): number | boolean | string {
  if (spec.kind === 'pct') return spec.pct
  if (spec.kind === 'bool') return spec.bool
  return spec.dflt
}

export function defaultOptions(design: DesignId = 'bibi'): Record<string, number | boolean | string> {
  const options: Record<string, number | boolean | string> = {}
  for (const spec of exposedOptions(design)) options[spec.name] = optionDefault(spec)
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

export function chestEaseFloor(design: DesignId = 'bibi'): number {
  return readOption('chestEase', design)?.min ?? -5
}

function addParts(table: Record<string, string>, parts: Record<string, string> | undefined) {
  if (!parts) return
  for (const [key, value] of Object.entries(parts)) table[key] = value
}

function translationTable(): Record<string, string> {
  const table: Record<string, string> = { ...annotationI18n.en }
  addParts(table, bibiI18n.en.p)
  addParts(table, shellyI18n.en.p)
  addParts(table, lilyI18n.en.p)
  if (shellyI18n.en.s?.foldLine) table['shelly:foldLine'] = shellyI18n.en.s.foldLine
  if (lilyI18n.en.s?.['adjustEase.t']) table['lily:adjustEase'] = lilyI18n.en.s['adjustEase.t']
  return table
}

export function exampleMeasurements(design: DesignId = 'bibi'): Record<string, number> {
  const wanted = new Set([...requiredMeasurements(design), ...optionalMeasurements(design)])
  const example: Record<string, number> = {}
  for (const [name, value] of Object.entries(cisFemaleAdult38)) {
    if (wanted.has(name) && typeof value === 'number') example[name] = value
  }
  return example
}

export function measurementIssues(
  measurements: Record<string, number | null>,
  design: DesignId = 'bibi',
): { missing: string[]; message: string | null } {
  const missing = requiredMeasurements(design).filter((name) => {
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
    message = 'Seat back has to be smaller than the full seat. The block uses seat minus seat back for the front.'
  }
  return { missing, message }
}

export function draftPattern(input: {
  design: DesignId
  measurements: Record<string, number | null>
  options: Record<string, number | boolean | string>
  saMm: number
  unit: Unit
  fabric: { direction: '2-way' | '4-way'; lengthwisePct: number; recoveredCm: number } | null
}): DraftResult {
  const design = input.design
  const specs = exposedOptions(design)
  const freesewingOptions: Record<string, number | boolean | string> = {}
  for (const spec of specs) {
    const value = clampOption(spec, input.options[spec.name] ?? optionDefault(spec))
    freesewingOptions[spec.name] = spec.kind === 'pct' ? Number(value) / 100 : value
  }

  const reduction = verticalReduction(input.fabric)
  const factor = 1 - reduction.appliedPct / 100
  const lengths: LengthChange[] = []
  const measurements: Record<string, number> = {}
  for (const name of [...requiredMeasurements(design), ...optionalMeasurements(design)]) {
    const value = input.measurements[name]
    if (value == null || !Number.isFinite(value)) continue
    if (name !== 'shoulderSlope' && value <= 0) continue
    const vertical =
      design !== 'lily' &&
      reduction.applies &&
      (VERTICAL_MEASUREMENTS as readonly string[]).includes(name)
    const applied = vertical ? value * factor : value
    measurements[name] = applied
    if (vertical) lengths.push({ name, originalMm: value, appliedMm: applied })
  }

  if (design === 'lily') {
    const spec = readOption('lengthReduction', 'lily')
    const pct = spec ? Number(clampOption(spec, reduction.appliedPct)) : reduction.appliedPct
    freesewingOptions.lengthReduction = pct / 100
    const original = input.measurements.waistToFloor
    if (original != null && Number.isFinite(original)) {
      lengths.push({
        name: 'waistToFloor',
        originalMm: original,
        appliedMm: original * (1 - pct / 100),
      })
    }
  }

  const Pattern = CONSTRUCTORS[design]
  const pattern = new Pattern({
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
  const neckFrontMm = Number(store?.get(design === 'shelly' ? 'neckLengthFront' : 'neckSizeFront') ?? 0)
  const neckBackMm = Number(store?.get(design === 'shelly' ? 'neckLengthBack' : 'neckSizeBack') ?? 0)
  const neckSideMm = Number(store?.get('neckLengthSide') ?? 0)
  const openingMm =
    design === 'shelly' ? neckFrontMm + neckBackMm + neckSideMm : design === 'bibi' ? 2 * (neckFrontMm + neckBackMm) : 0
  const logs = pattern.getLogs()
  const warnings = [...(logs.sets?.[0]?.warn ?? []), ...(logs.pattern?.warn ?? [])].filter(
    (line) => !line.startsWith('Store.'),
  )

  return {
    svg,
    widthMm: pattern.width,
    heightMm: pattern.height,
    openingMm,
    neckFrontMm,
    neckBackMm,
    neckSideMm,
    openingLabel:
      design === 'shelly'
        ? 'Shelly adds the front neck path, the back neck path, and one sleeve neck path. neckbandLength is a percent of that sum.'
        : design === 'bibi'
          ? 'Twice the front neck path plus twice the back neck path, because each path is half a piece cut on the fold.'
          : 'Lily has no neckline.',
    options: pattern.settings[0]?.options ?? {},
    absoluteOptions: pattern.settings[0]?.absoluteOptions ?? {},
    warnings,
    reduction,
    lengths,
  }
}

export function draftBibi(input: {
  measurements: Record<string, number | null>
  options: Record<string, number | boolean | string>
  saMm: number
  unit: Unit
}): DraftResult {
  return draftPattern({ ...input, design: 'bibi', fabric: null })
}

export function appliedPercent(result: DraftResult, name: string): number | null {
  const value = result.options[name]
  return typeof value === 'number' ? value * 100 : null
}
