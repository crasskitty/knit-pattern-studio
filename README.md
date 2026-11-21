# Knit Pattern Studio

A private, browser-only desk for drafting the FreeSewing **Bibi** knit top block. It is for Ashley Neale. There is no account, no server, and no grading. Measurements, fabrics, and options stay in `localStorage` on this browser.

Drafting is FreeSewing’s own formulas. Nothing here guesses ease with a model.

## Run

```bash
npm install && npm run dev
```

The dev server binds `0.0.0.0:4721`. Open [http://127.0.0.1:4721](http://127.0.0.1:4721).

`npm run check-scale` checks the millimetre-to-point conversion, Bibi’s chest-ease config, and that a 100 mm SVG line is drawn under a scale of `72/25.4`. `npm run build` typechecks and builds the static app.

## Packages

Installed and read for this build:

| Package | Version |
| --- | --- |
| `@freesewing/core` | 4.10.2 |
| `@freesewing/bibi` | 4.10.2 |
| `@freesewing/brian` | 4.10.2 |
| `@freesewing/library` | 4.10.2 |
| `@freesewing/plugin-bust` | 4.10.2 |
| `@freesewing/plugin-theme` | 4.10.2 |
| `@freesewing/plugin-i18n` | 4.10.2 |
| `@freesewing/plugin-transform` | 4.10.2 |
| `@freesewing/config` | 4.10.2 |
| `@freesewing/models` | 4.10.2 |
| `pdf-lib` | 1.17.1 |

Bibi imports Brian and the library sleeve. Core pulls in `@freesewing/core-plugins` and the annotation, measurement, mirror, round, sprinkle, and bin-pack plugins at the same 4.10.2 line. Option names, minima, maxima, and defaults below were read from `Bibi.patternConfig` after install, not from memory.

`stretchToScale` is a named export of `@freesewing/core` (`src/utils.mjs`):

```js
export function stretchToScale(stretch) {
  return 1 / (1 + parseFloat(stretch))
}
```

The app calls that export. A stretch fraction of `0.5` (50%) returns `2/3`.

## Stretch test

The same steps are in the Fabric section.

1. Wash and dry the fabric the way the garment will be worn.
2. Fold along the greatest stretch, a few inches in from the selvage.
3. Mark 10 cm (4 in).
4. Hold the left mark at a ruler and stretch until the fabric resists. Stop before it thins.
5. Record where the right mark lands. 15 cm is 50% stretch. Percent is `(landed − 10) / 10 × 100`.
6. Let go. If the marks are still 10.5 cm or more, recovery is poor.
7. Repeat along the length. Stretch both ways is 4-way. Stretch one way is 2-way.

Saved fields: name, crosswise %, lengthwise %, recovered length (cm, against the 10 cm mark), 2-way or 4-way, notes. You can list, edit, and delete them.

## How negative ease is derived

This is a starting point to confirm on a muslin. It is not a fit guarantee.

Circumference ease uses **crosswise** stretch, because that is the direction around the body when the greatest stretch goes around. Lengthwise stretch is stored so you can tell 2-way from 4-way. It is not applied to the Bibi draft.

Let `S` be crosswise stretch as a fraction (`50%` → `0.5`).

- `scale = stretchToScale(S) = 1 / (1 + S)`
- Full-stretch ease = `scale − 1` = `−S / (1 + S)`. That is the ease if the pattern used every bit of the measured stretch. At 50% stretch the scale is 0.667 and the full-stretch ease is −33.3%.

The studio does not suggest using all of it.

- Fitted top (this block): 25% to 45% of that full-stretch ease.
- Leggings (shown only, not drafted): 50% to 70% of that full-stretch ease.

Recovery, measured on the 10 cm mark after you let go:

- 10.2 cm or less: factor 1 (the suggestion stands).
- 11 cm or more: factor 0 (the suggestion is zero).
- Between those, the factor is `(11 − recovered) / 0.8`, a straight line.
- 10.5 cm is the poor-recovery mark from the stretch test. The factor there is 0.625, so the suggested range moves toward zero instead of being wiped out.

The screen always shows the stretch percent, the scale, the full-stretch ease, the recommended range, the recovery factor, and the ease value actually sent to Bibi. If a slider is more negative than the fitted-top range, the control warns you. The draft still uses the number on the control.

Vertical length reduction for 4-way fabric is not in this build.

## Measurements Bibi requires

From the resolved design config (`measurements` and `optionalMeasurements`). Units in the pattern are millimetres, except `shoulderSlope`, which `@freesewing/config` lists as a degree measurement. The centimetres / inches toggle only changes how values are shown.

Required:

- `biceps`, `chest`, `hpsToBust`, `hpsToWaistBack`, `neck`, `shoulderToShoulder`, `shoulderSlope`, `waistToArmpit`, `waistToHips` (from Brian’s base, which Bibi extends)
- `shoulderToWrist`, `wrist` (sleeve)
- `hips`, `waist`, `seat`, `seatBack`, `waistToSeat`, `hpsToWaistFront` (Bibi front and back)

Optional: `highBust`, `bustSpan`, `waistToUnderbust`, `waistToKnee`, `waistToFloor`.

`seatBack` has to be smaller than `seat`. Bibi treats the front seat as `seat − seatBack`.

If `waistToUnderbust` is blank, the block estimates `hpsToWaistBack / 6`. If `waistToKnee` is blank, it estimates `hpsToWaistBack × 1.5`. If `waistToFloor` is blank, it estimates `hpsToWaistBack × 2.5`. Those estimates are in `createLowerPoints` in Bibi’s source. Knee and floor lengths that rely on them are not a measured draft.

`draftForHighBust` defaults to on. `@freesewing/plugin-bust` then, when `highBust` is present and `bust` is not, sets `bust` to your chest and drafts the chest line from the high bust. The front spread runs only when `bustSpan` is present as well. The measurement notes in the app say this.

“Load the size 38 example” copies `cisFemaleAdult38` from `@freesewing/models`. That is a proportion model, not Ashley’s body.

## Options this studio exposes

Percent options are shown as percents. FreeSewing stores them as fractions (`2` → `0.02`). The app divides by 100 when it drafts. Core does not clamp to `min` / `max`. The app clamps to the configured range and shows the value it sent.

| Option | Kind | Default | Min | Max |
| --- | --- | --- | --- | --- |
| `chestEase` | percent of chest | 2 | **−5** | 25 |
| `waistEase` | percent of waist | 5 | −10 | 20 |
| `hipsEase` | percent of hips | 5 | −5 | 50 |
| `seatEase` | percent of seat | 2 | −5 | 50 |
| `fitWaist` | boolean | on | | |
| `draftForHighBust` | boolean | on | | |
| `bustEase` | percent | 0 | 0 | 10 |
| `sleeves` | boolean | on | | |
| `sleeveLength` | percent of shoulder-to-wrist | 20 | −20 | 110 |
| `cuffEase` | percent of wrist; Bibi’s own label is sleeve fullness | 20 | 0 | 200 |
| `length` | list | `seat` | `underbust`, `waist`, `hips`, `seat`, `knee`, `floor` | |
| `lengthBonus` | percent | 0 | −30 | 30 |
| `flare` | percent | 0 | 0 | 150 |
| `necklineWidth` | percent | 15 | −5 | 90 |
| `necklineDepth` | percent | 25 | 20 | 110 |
| `necklineBend` | percent | 50 | 0 | 70 |
| `backNeckCutout` | percent | 6 | 2 | 110 |
| `backNeckBend` | percent | 50 | 0 | 70 |
| `strapWidth` | percent | 40 | 15 | 100 |
| `armholeCurveFront` | percent | 15 | −10 | 30 |
| `armholeCurveBack` | percent | 30 | −10 | 120 |
| `armholeDropBack` | percent | 20 | −50 | 50 |
| `useWaistRibbing` | boolean | off | | |
| `useCuffRibbing` | boolean | off | | |
| `ribbingStretch` | percent | 15 | 0 | 30 |
| `ribbingHeight` | percent of back-waist length + waist-to-hips | 10 | 5 | 15 |
| `bindingHeight` | percent of that same sum; snaps to 10, 15, 20, 25, or 30 mm | 2.5 | 1.25 | 5 |

There is no Bibi option named seam allowance. Seam allowance is the pattern setting `sa`, in millimetres (`part.shorthand()` uses `settings.sa || 0`). This app defaults `sa` to 10 and shows that value. Set it to 0 and the draft has no seam allowance.

Names from the brief that are not a single option:

- “Neckline” is `necklineWidth`, `necklineDepth`, `necklineBend`, `backNeckCutout`, and `backNeckBend`.
- “Ribbing” is `useWaistRibbing`, `useCuffRibbing`, `ribbingStretch`, and `ribbingHeight`. The neck and armhole strip is `bindingHeight`.
- “Sleeve length” is `sleeveLength`, a percent of `shoulderToWrist`, not a millimetre length. Below 5% (`0.05`) Bibi treats it as a cap and hides the separate sleeve.
- “Fit waist” is `fitWaist`. With it off, `waistEase` is not applied. That matches the package menu, which hides `waistEase` unless `fitWaist` is on.
- “Length / flare” is `length`, `lengthBonus`, and `flare`. Flare’s menu is hidden until the hem is below the waist. The app keeps the control visible and says when it has no effect.

`cuffEase` is included because Bibi’s English strings call it sleeve fullness. Many other options (sleevecap factors, `bicepsEase` default 5, `shoulderEase` default 0, `armholeDepth` default 2, `curvatureAdjustment` default 50, and the rest) stay at the package defaults. They are not hidden inside the draft; they are simply not controls on this desk.

### Chest-ease floor

`chestEase.min` is **−5** (percent). The app will not send a more negative chest ease. A fabric can still be capable of more negative ease than that. The capacity card says so when the fitted range goes below −5%, and the button that applies the range stops at the floor.

### Dress lengths

Bibi’s `length` list includes `knee` and `floor`, and the package strings call those a knee-length dress and a floor-length dress. This studio does not. They are hem lines on a knit top block. A wearable dress still needs design work. The draft warns when either length is selected.

## Neckband helper

The drafted opening is `2 × (neckSizeFront + neckSizeBack)`. Each stored length is half a piece cut on the fold, which is the same quantity Bibi uses for its neck binding (`draftKnitBinding(part, 2 * (store.neckSizeBack + store.neckSizeFront))`).

Cut length = opening × your percent + `2 × sa`. The default percent is 85, inside the 80–85% window, and both 80% and 85% lengths are shown. That length is a starting cut, not a finished band. Bibi’s own binding rectangle is still drawn at 100% of the opening. Its width is four times `bindingHeight` after the millimetre snap.

## Export and printing

- SVG download is the FreeSewing render. The root `width` / `height` are millimetres and the `viewBox` is in the same millimetre user units, so the file is 1:1.
- A0, A4, and Letter PDFs are built in the browser with pdf-lib. No server.
- Pages use one conversion: `1 mm = 72 / 25.4` points. pdf-lib’s `PageSizes` match that within 0.02 pt (A0, A4, and Letter were compared in `scripts/check-scale.mjs`).
- A 5 cm square is drawn as a 141.732 pt square (`50 × 72 / 25.4`). A 2 in square is drawn as a 144 pt square (`2 × 72`). Both are on every tiled page.
- A 100 mm SVG line is placed with `scale: 72/25.4` and a flipped Y axis, which is how pdf-lib’s `drawSvgPath` maps SVG millimetres onto the page. The content stream keeps the path at `100 0 l` and the current transformation matrix at `2.834645669291339 0 0 -2.834645669291339`.
- Tiles sit inside a 10 mm margin. The pattern viewport is the printable area minus a 78 mm footer. Neighbouring tiles overlap by 10 mm. Each page has registration crosses on the viewport corners, a page map, and the line “Print at 100% / actual size. Do not fit or scale.”
- If the draft is taller than one A0 sheet, the copyshop file is more than one A0 page, still at 1:1. The export panel states the page counts.
- The on-screen preview is scaled to the panel. Only the downloads are 1:1.

Print every PDF at **100% / actual size**. Do not use “fit to page”. Measure the 5 cm square and the 2 in square before cutting.

## License

FreeSewing’s core, Bibi, and the plugins this app drafts with are MIT licensed.

```
MIT License

Copyright (c) 2022 Joost De Cock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The same notice is in the app, under the preview. Pattern geometry is Copyright Joost De Cock and FreeSewing contributors, used under that license. Source: [FreeSewing LICENSE](https://codeberg.org/freesewing/freesewing/src/branch/develop/LICENSE).

## Next

Not in this build:

- Phase 2: Shelly (`@freesewing/shelly`), Lily (`@freesewing/lily`) or Lumira for leggings, vertical length reduction for 4-way fabrics, projector PDF.
- Phase 3: an original dartless tube/pencil skirt and a wrap top. An optional local Ollama helper could come later.
