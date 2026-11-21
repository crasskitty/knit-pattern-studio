import type { DesignId } from './bibi'
import type { Unit } from './units'

export type FabricDirection = '2-way' | '4-way'

export type Fabric = {
  id: string
  name: string
  crosswisePct: number
  lengthwisePct: number
  recoveredCm: number
  direction: FabricDirection
  notes: string
}

export type StudioState = {
  version: 1
  unit: Unit
  fabrics: Fabric[]
  selectedFabricId: string | null
  measurements: Record<string, number | null>
  design: DesignId
  optionsByDesign: Record<DesignId, Record<string, number | boolean | string>>
  saMm: number
  neckbandPercent: number
  projector: 'light' | 'dark'
}

const KEY = 'knit-pattern-studio.v1'

/** 3/8 inch, the fresh-browser seam allowance. */
export const DEFAULT_SA_MM = Math.round((3 / 8) * 25.4 * 1000) / 1000
export const DEFAULT_NECKBAND_PERCENT = 85

const EMPTY_OPTIONS = (): StudioState['optionsByDesign'] => ({ bibi: {}, shelly: {}, lily: {} })

export function emptyState(): StudioState {
  return {
    version: 1,
    unit: 'in',
    fabrics: [],
    selectedFabricId: null,
    measurements: {},
    design: 'bibi',
    optionsByDesign: EMPTY_OPTIONS(),
    saMm: DEFAULT_SA_MM,
    neckbandPercent: DEFAULT_NECKBAND_PERCENT,
    projector: 'light',
  }
}

function isDesign(value: unknown): value is DesignId {
  return value === 'bibi' || value === 'shelly' || value === 'lily'
}

function optionBag(value: unknown): Record<string, number | boolean | string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, number | boolean | string>
}

export function loadState(): StudioState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<StudioState> & {
      options?: Record<string, number | boolean | string>
    }
    if (parsed.version !== 1) return emptyState()
    const optionsByDesign = EMPTY_OPTIONS()
    const storedBags = parsed.optionsByDesign
    if (storedBags && typeof storedBags === 'object') {
      optionsByDesign.bibi = optionBag(storedBags.bibi)
      optionsByDesign.shelly = optionBag(storedBags.shelly)
      optionsByDesign.lily = optionBag(storedBags.lily)
    } else if (parsed.options && typeof parsed.options === 'object') {
      optionsByDesign.bibi = optionBag(parsed.options)
    }
    const unit: Unit = parsed.unit === 'cm' || parsed.unit === 'in' ? parsed.unit : 'in'
    return {
      ...emptyState(),
      unit,
      fabrics: Array.isArray(parsed.fabrics) ? parsed.fabrics : [],
      selectedFabricId: parsed.selectedFabricId ?? null,
      measurements: parsed.measurements ?? {},
      design: isDesign(parsed.design) ? parsed.design : 'bibi',
      optionsByDesign,
      saMm: typeof parsed.saMm === 'number' ? parsed.saMm : DEFAULT_SA_MM,
      neckbandPercent:
        typeof parsed.neckbandPercent === 'number'
          ? parsed.neckbandPercent
          : DEFAULT_NECKBAND_PERCENT,
      projector: parsed.projector === 'dark' ? 'dark' : 'light',
    }
  } catch {
    return emptyState()
  }
}

export function saveState(state: StudioState): string | null {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    return null
  } catch (error) {
    return error instanceof Error ? error.message : 'Could not save in this browser.'
  }
}
