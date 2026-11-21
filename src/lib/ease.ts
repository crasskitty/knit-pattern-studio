import { stretchToScale } from '@freesewing/core'

/**
 * Stretch test gauge. The app stores recovered length against this 10 cm mark.
 * 15 cm on the ruler is 50% stretch. 10.5 cm or more after release is poor recovery.
 */
export const GAUGE_CM = 10
export const POOR_RECOVERY_CM = 10.5
export const FULL_RECOVERY_CM = 10.2
export const NO_RECOVERY_CM = 11

/**
 * Share of the mathematical full-stretch ease that is suggested as a working range.
 * The low share is closer to zero ease. The high share is the more negative end.
 * These fractions are the studio's starting-point rule, not a FreeSewing option.
 */
export const FITTED_TOP_SHARE = { low: 0.25, high: 0.45 }
export const LEGGINGS_SHARE = { low: 0.5, high: 0.7 }

export type EaseBand = {
  moreNegative: number
  closerToZero: number
}

export type EaseCapacity = {
  crosswisePct: number
  lengthwisePct: number
  scale: number
  lengthwiseScale: number
  fullEasePct: number
  recoveryFactor: number
  poorRecovery: boolean
  fittedTop: EaseBand
  leggings: EaseBand
}

export function stretchPercentFromMark(landedCm: number): number {
  return ((landedCm - GAUGE_CM) / GAUGE_CM) * 100
}

export function recoveryFactor(recoveredCm: number): number {
  if (recoveredCm <= FULL_RECOVERY_CM) return 1
  if (recoveredCm >= NO_RECOVERY_CM) return 0
  return (NO_RECOVERY_CM - recoveredCm) / (NO_RECOVERY_CM - FULL_RECOVERY_CM)
}

function band(fullEasePct: number, factor: number, share: { low: number; high: number }): EaseBand {
  return {
    moreNegative: fullEasePct * share.high * factor,
    closerToZero: fullEasePct * share.low * factor,
  }
}

export function easeCapacity(input: {
  crosswisePct: number
  lengthwisePct: number
  recoveredCm: number
}): EaseCapacity {
  const crosswise = Math.max(0, input.crosswisePct) / 100
  const lengthwise = Math.max(0, input.lengthwisePct) / 100
  const scale = stretchToScale(crosswise)
  const fullEasePct = (scale - 1) * 100
  const factor = recoveryFactor(input.recoveredCm)
  return {
    crosswisePct: input.crosswisePct,
    lengthwisePct: input.lengthwisePct,
    scale,
    lengthwiseScale: stretchToScale(lengthwise),
    fullEasePct,
    recoveryFactor: factor,
    poorRecovery: input.recoveredCm >= POOR_RECOVERY_CM,
    fittedTop: band(fullEasePct, factor, FITTED_TOP_SHARE),
    leggings: band(fullEasePct, factor, LEGGINGS_SHARE),
  }
}

export function exceedsCapacity(appliedPct: number, capacity: EaseCapacity, band: 'fittedTop' | 'leggings' = 'fittedTop'): boolean {
  return appliedPct < capacity[band].moreNegative - 0.05
}

/** Straight distances shortened for 4-way fabric. Circumferences are not in this list. */
export const VERTICAL_MEASUREMENTS = [
  'hpsToBust',
  'hpsToWaistBack',
  'hpsToWaistFront',
  'shoulderToElbow',
  'shoulderToWrist',
  'waistToArmpit',
  'waistToUnderbust',
  'waistToHips',
  'waistToSeat',
  'waistToUpperLeg',
  'waistToKnee',
  'waistToFloor',
  'crotchDepth',
  'inseam',
] as const

export const VERTICAL_REDUCTION_SHARE = 0.5

export type VerticalReduction = {
  applies: boolean
  reason: string
  lengthwisePct: number
  lengthwiseScale: number
  fullReductionPct: number
  recoveryFactor: number
  appliedPct: number
}

export function verticalReduction(input: {
  direction: '2-way' | '4-way'
  lengthwisePct: number
  recoveredCm: number
} | null): VerticalReduction {
  if (!input) {
    return {
      applies: false,
      reason: 'Choose a saved fabric to calculate a vertical reduction.',
      lengthwisePct: 0,
      lengthwiseScale: 1,
      fullReductionPct: 0,
      recoveryFactor: 1,
      appliedPct: 0,
    }
  }
  const lengthwise = Math.max(0, input.lengthwisePct) / 100
  const scale = stretchToScale(lengthwise)
  const fullReductionPct = (1 - scale) * 100
  const factor = recoveryFactor(input.recoveredCm)
  if (input.direction !== '4-way') {
    return {
      applies: false,
      reason: 'This fabric is 2-way, so the draft is not shortened lengthwise.',
      lengthwisePct: input.lengthwisePct,
      lengthwiseScale: scale,
      fullReductionPct,
      recoveryFactor: factor,
      appliedPct: 0,
    }
  }
  return {
    applies: true,
    reason: 'Starting point for a 4-way knit. Confirm the shorter length on a muslin.',
    lengthwisePct: input.lengthwisePct,
    lengthwiseScale: scale,
    fullReductionPct,
    recoveryFactor: factor,
    appliedPct: fullReductionPct * VERTICAL_REDUCTION_SHARE * factor,
  }
}

/** Stretch-test gauge. 10 cm and 4 in are the same nominal mark, not a 25.4 conversion. */
export function gaugeCm(): number {
  return GAUGE_CM
}

export function gaugeInUnit(unit: 'cm' | 'in'): number {
  return unit === 'cm' ? GAUGE_CM : 4
}

export function poorRecoveryInUnit(unit: 'cm' | 'in'): number {
  return unit === 'cm' ? POOR_RECOVERY_CM : (POOR_RECOVERY_CM / GAUGE_CM) * 4
}

export function recoveredToDisplay(recoveredCm: number, unit: 'cm' | 'in'): number {
  return (recoveredCm / GAUGE_CM) * gaugeInUnit(unit)
}

export function displayToRecovered(display: number, unit: 'cm' | 'in'): number {
  return (display / gaugeInUnit(unit)) * GAUGE_CM
}
