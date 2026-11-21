import { parseLengthToMm, formatInches, formatCentimetres } from '../src/lib/fractions.ts'
import { verticalReduction } from '../src/lib/ease.ts'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const sa = parseLengthToMm('3/8', 'in')
assert(sa === 9.525, `3/8 in should be 9.525 mm, got ${sa}`)
assert(formatInches(sa) === '3/8', `back to inches got ${formatInches(sa)}`)
const cmText = formatCentimetres(sa)
const back = parseLengthToMm(cmText, 'cm')
assert(Math.abs(back - sa) < 0.001, `cm round trip ${cmText} -> ${back}`)
assert(formatInches(back) === '3/8', `inches after cm got ${formatInches(back)}`)

const mixed = parseLengthToMm('1 1/2', 'in')
assert(formatInches(mixed) === '1 1/2', formatInches(mixed))
assert(parseLengthToMm('1-1/2', 'in') === mixed, 'hyphen mixed number')
assert(parseLengthToMm('5/8', 'in') != null, '5/8')
assert(parseCentimetresSafe('3/8') === null, 'cm rejects fractions')

const body = parseLengthToMm('36.5', 'in')
const bodyCm = formatCentimetres(body)
const bodyBack = parseLengthToMm(bodyCm, 'cm')
assert(Math.abs(bodyBack - body) < 0.001, `body round trip ${body} ${bodyCm} ${bodyBack}`)
assert(formatInches(bodyBack) === formatInches(body), 'body inches stable')

const fourWay = verticalReduction({ direction: '4-way', lengthwisePct: 40, recoveredCm: 10 })
assert(fourWay.applies && fourWay.appliedPct > 0, '4-way reduces')
const poor = verticalReduction({ direction: '4-way', lengthwisePct: 40, recoveredCm: 11 })
assert(poor.appliedPct === 0, 'poor recovery zeros the reduction')
const two = verticalReduction({ direction: '2-way', lengthwisePct: 40, recoveredCm: 10 })
assert(!two.applies && two.appliedPct === 0, '2-way does not reduce')

console.log(JSON.stringify({ sa, cmText, fourWayApplied: fourWay.appliedPct, full: fourWay.fullReductionPct }, null, 2))
console.log('unit check passed')

function parseCentimetresSafe(text) {
  return /^\s*-?\d+(\.\d+)?\s*$/.test(text) ? Number(text) : null
}
