import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { MIT_NOTICE } from '@/lib/copy'
import { downloadBlob, downloadText } from '@/lib/download'
import { buildTiledPdf, type Paper } from '@/lib/export-pdf'
import { flattenSvg } from '@/lib/flatten-svg'
import type { DraftResult } from '@/lib/bibi'
import { PAGE_MM, planTiles } from '@/lib/scale.mjs'
import { formatLength, formatMm, formatPercent, type Unit } from '@/lib/units'

export function PreviewColumn({
  drafting,
  error,
  issue,
  missing,
  result,
  warnings,
  saMm,
  neckbandPercent,
  onNeckband,
  unit,
}: {
  drafting: boolean
  error: string | null
  issue: string | null
  missing: string[]
  result: DraftResult | null
  warnings: string[]
  saMm: number
  neckbandPercent: number
  onNeckband: (percent: number) => void
  unit: Unit
}) {
  const [exporting, setExporting] = useState<Paper | 'svg' | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const opening = result?.openingMm ?? 0
  const band = opening * (neckbandPercent / 100) + 2 * saMm
  const at80 = opening * 0.8 + 2 * saMm
  const at85 = opening * 0.85 + 2 * saMm
  const bindingMm = result?.absoluteOptions.bindingHeight

  async function exportPdf(paper: Paper) {
    if (!result) return
    setExporting(paper)
    setExportError(null)
    try {
      const flat = flattenSvg(result.svg)
      if (Math.abs(flat.widthMm - round1(result.widthMm)) > 2) {
        throw new Error('SVG viewBox width does not match the drafted width.')
      }
      const bytes = await buildTiledPdf(flat, paper)
      const copy = new Uint8Array(bytes)
      downloadBlob(new Blob([copy], { type: 'application/pdf' }), `bibi-${paper.toLowerCase()}-actual-size.pdf`)
    } catch (cause) {
      setExportError(cause instanceof Error ? cause.message : 'Export failed.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex min-h-[50vh] flex-col gap-4 p-4 lg:h-full lg:overflow-auto">
      <div className="pattern-frame max-h-[70vh] min-h-64 flex-1 overflow-auto rounded-xl border bg-white shadow-sm lg:max-h-none">
        {drafting && !result && (
          <p className="p-6 text-sm text-muted-foreground">Drafting Bibi…</p>
        )}
        {!drafting && !result && missing.length > 0 && (
          <div className="space-y-2 p-6">
            <p className="font-medium">Nothing to draft yet</p>
            <p className="text-sm text-muted-foreground">
              Fill the required measurements. Still missing: {missing.join(', ')}.
            </p>
          </div>
        )}
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTitle>The draft failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        {issue && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTitle>Check the measurements</AlertTitle>
              <AlertDescription>{issue}</AlertDescription>
            </Alert>
          </div>
        )}
        {result && (
          <div
            className={drafting ? 'opacity-70' : ''}
            dangerouslySetInnerHTML={{ __html: result.svg.replace(/^<\?xml[^>]*>/, '') }}
          />
        )}
      </div>
      {result && (
        <p className="text-xs text-muted-foreground">
          {drafting ? 'Updating the draft. ' : ''}
          Preview is fitted to the panel. Downloads are 1:1. Draft bounds {formatMm(result.widthMm, 1)} by {formatMm(result.heightMm, 1)}.
        </p>
      )}
      {warnings.length > 0 && (
        <Alert>
          <AlertTitle>Bibi adjusted the draft</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {warnings.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <section className="space-y-2 rounded-xl border bg-card p-3">
        <h2 className="font-medium">Neckband starting length</h2>
        <p className="text-sm text-muted-foreground">
          Opening circumference is twice the drafted front neck plus twice the drafted back neck, because each path is half a piece cut on the fold. Band length = opening × your percent + 2 × seam allowance. This is a starting length to cut, not a finished band and not the length after it is stretched on.
        </p>
        {result ? (
          <ul className="space-y-1 text-sm">
            <li>Front half {formatLength(result.neckFrontMm, unit)} · back half {formatLength(result.neckBackMm, unit)}</li>
            <li>Opening {formatLength(opening, unit)} ({formatMm(opening, 1)})</li>
            <li>80% window {formatLength(at80, unit)} · 85% window {formatLength(at85, unit)}</li>
            <li className="font-medium">
              Cut length at {neckbandPercent}% {formatLength(band, unit)} ({formatMm(band, 1)}), including 2 × {formatMm(saMm, 1)} seam allowance
            </li>
            <li>
              Bibi’s own neck binding rectangle is drafted at 100% of the opening
              {typeof bindingMm === 'number' ? `, ${formatMm(bindingMm * 4, 1)} wide (4 × the snapped binding height of ${formatMm(bindingMm, 1)})` : ''}. The helper is the shorter length to cut if you want the band taken in.
            </li>
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">The opening appears once a draft exists.</p>
        )}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <Label htmlFor="neck-pct">Band percent of the opening</Label>
            <span>{formatPercent(neckbandPercent, 0)}</span>
          </div>
          <Slider
            id="neck-pct"
            min={70}
            max={100}
            step={1}
            value={[neckbandPercent]}
            onValueChange={(next) => onNeckband(next[0] ?? neckbandPercent)}
          />
          <p className="text-xs text-muted-foreground">Usual starting window is 80–85%. The slider default is 85%.</p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Export</h2>
        <p className="text-sm text-muted-foreground">
          Print at 100% / actual size. Tiles sit inside a 10 mm margin, overlap by 10 mm, and carry registration marks, a page map, a 5 cm square, and a 2 in square.
          {result
            ? ` This draft is ${planTiles(result.widthMm, result.heightMm, PAGE_MM.A0).tiles.length} A0 page(s), ${planTiles(result.widthMm, result.heightMm, PAGE_MM.A4).tiles.length} A4 pages, ${planTiles(result.widthMm, result.heightMm, PAGE_MM.Letter).tiles.length} Letter pages.`
            : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={!result || exporting !== null} onClick={() => result && downloadText(result.svg, 'bibi.svg', 'image/svg+xml')}>
            Download SVG
          </Button>
          <Button type="button" variant="outline" disabled={!result || exporting !== null} onClick={() => exportPdf('A0')}>
            {exporting === 'A0' ? 'Building A0…' : 'A0 copyshop PDF'}
          </Button>
          <Button type="button" variant="outline" disabled={!result || exporting !== null} onClick={() => exportPdf('A4')}>
            {exporting === 'A4' ? 'Building A4…' : 'A4 tiled PDF'}
          </Button>
          <Button type="button" variant="outline" disabled={!result || exporting !== null} onClick={() => exportPdf('Letter')}>
            {exporting === 'Letter' ? 'Building Letter…' : 'Letter tiled PDF'}
          </Button>
        </div>
        {exportError && <p className="text-sm text-destructive">{exportError}</p>}
      </section>

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground">FreeSewing MIT notice</summary>
        <pre className="mt-2 whitespace-pre-wrap font-sans">{MIT_NOTICE}</pre>
      </details>
    </div>
  )
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}
