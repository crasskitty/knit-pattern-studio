import { PDFDocument, PageSizes, rgb } from 'pdf-lib'
import { Bibi } from '@freesewing/bibi'
import { stretchToScale } from '@freesewing/core'
import { cisFemaleAdult38 } from '@freesewing/models'
import { MM_TO_PT, PAGE_MM, mmToPt, planTiles } from '../src/lib/scale.mjs'
import { transformPath, pathBounds, parseTransform } from '../src/lib/svg-math.mjs'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const fiveCm = mmToPt(50)
const twoInch = 2 * 72
assert(Math.abs(fiveCm - 50 * 72 / 25.4) < 1e-9, '5 cm conversion')
assert(twoInch === 144, '2 in is 144 pt')
assert(Math.abs(PageSizes.A4[0] - mmToPt(PAGE_MM.A4.width)) < 0.02, 'A4 width')
assert(Math.abs(PageSizes.A4[1] - mmToPt(PAGE_MM.A4.height)) < 0.02, 'A4 height')
assert(Math.abs(PageSizes.A0[0] - mmToPt(PAGE_MM.A0.width)) < 0.02, 'A0 width')
assert(Math.abs(PageSizes.Letter[0] - mmToPt(PAGE_MM.Letter.width)) < 0.02, 'Letter width')

assert(Math.abs(stretchToScale(0.5) - 1 / 1.5) < 1e-12, 'stretchToScale 50%')
assert(Math.abs(stretchToScale(0) - 1) < 1e-12, 'stretchToScale 0')

const cfg = Bibi.patternConfig ?? new Bibi().getConfig()
const chest = cfg.options.chestEase
assert(chest.pct === 2 && chest.min === -5 && chest.max === 25, `chestEase ${JSON.stringify(chest)}`)
assert(cfg.options.fitWaist.bool === true, 'fitWaist')
assert(cfg.options.sleeves.bool === true, 'sleeves')
assert(cfg.options.length.dflt === 'seat', 'length default')
assert(!cfg.options.sa && !cfg.options.seamAllowance, 'sa is not a design option')

const moved = pathBounds(transformPath('M 0 0 L 100 0', parseTransform('translate(12, 4)')))
assert(moved && Math.abs(moved.width - 100) < 0.01, '100 mm line stays 100 mm after translate')

const pattern = new Bibi({
  sa: 10,
  complete: true,
  measurements: { ...cisFemaleAdult38 },
})
const svg = pattern.draft().render()
const widthAttr = svg.match(/width="([\d.]+)mm"/)
const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
assert(widthAttr && viewBox, 'svg size')
assert(Math.abs(Number(widthAttr[1]) - Number(viewBox[1])) < 0.05, 'width attribute matches viewBox')
assert(Math.abs(pattern.width - Number(viewBox[1])) < 0.2, `pattern width ${pattern.width} vs viewBox ${viewBox[1]}`)
assert(pattern.settings[0].sa === 10, 'sa setting stored')

const doc = await PDFDocument.create()
const page = doc.addPage([mmToPt(210), mmToPt(297)])
page.drawRectangle({
  x: 72,
  y: 72,
  width: fiveCm,
  height: fiveCm,
  borderWidth: 1,
  borderColor: rgb(0, 0, 0),
})
page.drawRectangle({
  x: 72,
  y: 300,
  width: twoInch,
  height: twoInch,
  borderWidth: 1,
  borderColor: rgb(0, 0, 0),
})
page.drawSvgPath('M 0 0 L 100 0', {
  x: 72,
  y: 500,
  scale: MM_TO_PT,
  borderColor: rgb(0, 0, 0),
  borderWidth: 0.4,
})
const contents = page.getContentStream().getContentsString()
assert(contents.includes('141.73228346456693'), `5 cm square missing\n${contents}`)
assert(contents.includes('144 144'), `2 in square missing\n${contents}`)
assert(
  contents.includes(`${MM_TO_PT} 0 0 -${MM_TO_PT}`) && contents.includes('100 0 l'),
  `100 mm path is not scaled by MM_TO_PT\n${contents}`,
)

const letter = planTiles(pattern.width, pattern.height, PAGE_MM.Letter)
const a0 = planTiles(pattern.width, pattern.height, PAGE_MM.A0)
console.log(JSON.stringify({
  chestEase: { pct: chest.pct, min: chest.min, max: chest.max },
  sa: pattern.settings[0].sa,
  viewBox,
  widthMm: pattern.width,
  heightMm: pattern.height,
  fiveCmPt: fiveCm,
  twoInchPt: twoInch,
  linePt: 100 * MM_TO_PT,
  letterTiles: letter.tiles.length,
  a0Tiles: a0.tiles.length,
  stretch50: stretchToScale(0.5),
}, null, 2))
console.log('scale check passed')
