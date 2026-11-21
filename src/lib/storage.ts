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
  options: Record<string, number | boolean | string>
  saMm: number
  neckbandPercent: number
}

const KEY = 'knit-pattern-studio.v1'

export const DEFAULT_SA_MM = 10
export const DEFAULT_NECKBAND_PERCENT = 85

export function emptyState(): StudioState {
  return {
    version: 1,
    unit: 'cm',
    fabrics: [],
    selectedFabricId: null,
    measurements: {},
    options: {},
    saMm: DEFAULT_SA_MM,
    neckbandPercent: DEFAULT_NECKBAND_PERCENT,
  }
}

export function loadState(): StudioState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<StudioState>
    if (parsed.version !== 1) return emptyState()
    return {
      ...emptyState(),
      ...parsed,
      version: 1,
      fabrics: Array.isArray(parsed.fabrics) ? parsed.fabrics : [],
      measurements: parsed.measurements ?? {},
      options: parsed.options ?? {},
      saMm: typeof parsed.saMm === 'number' ? parsed.saMm : DEFAULT_SA_MM,
      neckbandPercent:
        typeof parsed.neckbandPercent === 'number'
          ? parsed.neckbandPercent
          : DEFAULT_NECKBAND_PERCENT,
      unit: parsed.unit === 'in' ? 'in' : 'cm',
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
