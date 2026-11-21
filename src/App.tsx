import { useEffect, useMemo, useState } from 'react'
import { DraftPanel } from '@/components/DraftPanel'
import { FabricPanel } from '@/components/FabricPanel'
import { MeasurePanel } from '@/components/MeasurePanel'
import { PreviewColumn } from '@/components/PreviewColumn'
import { Button } from '@/components/ui/button'
import {
  DESIGNS,
  chestEaseFloor,
  clampOption,
  defaultOptions,
  draftPattern,
  exposedOptions,
  measurementIssues,
  missingExposedOptions,
  optionalMeasurements,
  readOption,
  requiredMeasurements,
  type DraftResult,
} from '@/lib/bibi'
import { easeCapacity } from '@/lib/ease'
import {
  loadState,
  saveState,
  type Fabric,
  type StudioState,
} from '@/lib/storage'
import { emptyState } from '@/lib/storage'

export default function App() {
  const [state, setState] = useState<StudioState>(emptyState)
  const [ready, setReady] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftResult | null>(null)
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)

  const design = state.design
  const specs = useMemo(() => exposedOptions(design), [design])
  const missingNames = useMemo(() => missingExposedOptions(design), [design])
  const required = useMemo(() => requiredMeasurements(design), [design])
  const optional = useMemo(() => optionalMeasurements(design), [design])

  useEffect(() => {
    setState(loadState())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    setSaveError(saveState(state))
  }, [state, ready])

  const options = useMemo(() => {
    const merged = { ...defaultOptions(design), ...state.optionsByDesign[design] }
    for (const spec of specs) merged[spec.name] = clampOption(spec, merged[spec.name] ?? spec.pct)
    return merged
  }, [state.optionsByDesign, specs, design])

  const fabric = state.fabrics.find((item) => item.id === state.selectedFabricId) ?? null
  const capacity = fabric ? easeCapacity(fabric) : null
  const issues = measurementIssues(state.measurements, design)

  useEffect(() => {
    if (!ready) return
    if (issues.missing.length > 0 || issues.message) {
      setDraft(null)
      setDraftError(null)
      setDrafting(false)
      return
    }
    setDrafting(true)
    const timer = window.setTimeout(() => {
      try {
        setDraft(
          draftPattern({
            design,
            measurements: state.measurements,
            options,
            saMm: state.saMm,
            unit: state.unit,
            fabric,
          }),
        )
        setDraftError(null)
      } catch (cause) {
        setDraftError(cause instanceof Error ? cause.message : 'Bibi could not draft.')
      } finally {
        setDrafting(false)
      }
    }, 160)
    return () => window.clearTimeout(timer)
  }, [ready, design, state.measurements, state.saMm, state.unit, options, fabric, issues.missing.length, issues.message])

  function patch(partial: Partial<StudioState>) {
    setState((current) => ({ ...current, ...partial }))
  }

  function saveFabric(next: Fabric) {
    setState((current) => {
      const exists = current.fabrics.some((item) => item.id === next.id)
      const fabrics = exists
        ? current.fabrics.map((item) => (item.id === next.id ? next : item))
        : [next, ...current.fabrics]
      return {
        ...current,
        fabrics,
        selectedFabricId: current.selectedFabricId ?? next.id,
      }
    })
  }

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b px-4 py-3">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Private pattern desk</p>
          <h1 className="font-heading text-2xl font-semibold">Knit Pattern Studio</h1>
          <p className="text-sm text-muted-foreground">Ashley Neale · on this browser only</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">Units</span>
          <Button type="button" size="sm" variant={state.unit === 'in' ? 'default' : 'outline'} onClick={() => patch({ unit: 'in' })}>
            Inches
          </Button>
          <Button type="button" size="sm" variant={state.unit === 'cm' ? 'default' : 'outline'} onClick={() => patch({ unit: 'cm' })}>
            Centimetres
          </Button>
        </div>
      </header>
      {saveError && (
        <p className="bg-destructive/10 px-4 py-2 text-sm text-destructive">Could not save: {saveError}</p>
      )}
      <div className="studio-shell">
        <aside className="studio-controls space-y-8 px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {DESIGNS.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={design === item.id ? 'default' : 'outline'}
                onClick={() => patch({ design: item.id })}
              >
                {item.title}
                <span className="ml-1 text-xs opacity-80">{item.blurb}</span>
              </Button>
            ))}
          </div>
          <FabricPanel
            fabrics={state.fabrics}
            selectedId={state.selectedFabricId}
            unit={state.unit}
            onSave={saveFabric}
            onDelete={(id) =>
              setState((current) => ({
                ...current,
                fabrics: current.fabrics.filter((item) => item.id !== id),
                selectedFabricId: current.selectedFabricId === id ? null : current.selectedFabricId,
              }))
            }
            onSelect={(id) => patch({ selectedFabricId: id })}
          />
          <MeasurePanel
            unit={state.unit}
            design={design}
            required={required}
            optional={optional}
            measurements={state.measurements}
            onChange={(name, value) =>
              setState((current) => ({
                ...current,
                measurements: { ...current.measurements, [name]: value },
              }))
            }
            onExample={(values) =>
              setState((current) => ({
                ...current,
                measurements: { ...current.measurements, ...values },
              }))
            }
          />
          <DraftPanel
            design={design}
            specs={specs}
            missing={missingNames}
            options={options}
            onOption={(name, value) =>
              setState((current) => ({
                ...current,
                optionsByDesign: {
                  ...current.optionsByDesign,
                  [design]: { ...current.optionsByDesign[design], [name]: value },
                },
              }))
            }
            saMm={state.saMm}
            onSa={(saMm) => patch({ saMm })}
            unit={state.unit}
            capacity={capacity}
            onUseRange={(chestPct) =>
              setState((current) => ({
                ...current,
                optionsByDesign: {
                  ...current.optionsByDesign,
                  bibi: {
                    ...current.optionsByDesign.bibi,
                    chestEase: Math.max(chestEaseFloor('bibi'), chestPct),
                  },
                },
              }))
            }
            onMatchStretch={() =>
              setState((current) => {
                const stretch = Number(current.optionsByDesign.lily.fabricStretch ?? readOption('fabricStretch', 'lily')?.pct ?? 40)
                const ease = Math.round((-stretch / 10) * 10) / 10
                return {
                  ...current,
                  optionsByDesign: {
                    ...current.optionsByDesign,
                    lily: {
                      ...current.optionsByDesign.lily,
                      waistEase: ease,
                      seatEase: ease,
                      kneeEase: ease,
                    },
                  },
                }
              })
            }
            result={draft}
          />
        </aside>
        <main className="studio-preview">
          <PreviewColumn
            drafting={drafting}
            error={draftError}
            issue={issues.message}
            missing={issues.missing}
            result={draft}
            warnings={draft?.warnings ?? []}
            saMm={state.saMm}
            neckbandPercent={state.neckbandPercent}
            onNeckband={(neckbandPercent) => patch({ neckbandPercent })}
            unit={state.unit}
            design={design}
            projector={state.projector}
            onProjector={(projector) => patch({ projector })}
          />
        </main>
      </div>
    </div>
  )
}
