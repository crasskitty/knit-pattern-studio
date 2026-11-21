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

export function exceedsCapacity(appliedPct: number, capacity: EaseCapacity): boolean {
  return appliedPct < capacity.fittedTop.moreNegative - 0.05
}
