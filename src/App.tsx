import { useEffect, useMemo, useState } from 'react'
import { DraftPanel } from '@/components/DraftPanel'
import { FabricPanel } from '@/components/FabricPanel'
import { MeasurePanel } from '@/components/MeasurePanel'
import { PreviewColumn } from '@/components/PreviewColumn'
import {
  chestEaseFloor,
  clampOption,
  defaultOptions,
  draftBibi,
  exposedOptions,
  measurementIssues,
  missingExposedOptions,
  optionalMeasurements,
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
import type { Unit } from '@/lib/units'

export default function App() {
  const [state, setState] = useState<StudioState>(emptyState)
  const [ready, setReady] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftResult | null>(null)
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)

  const specs = useMemo(() => exposedOptions(), [])
  const missingNames = useMemo(() => missingExposedOptions(), [])
  const required = useMemo(() => requiredMeasurements(), [])
  const optional = useMemo(() => optionalMeasurements(), [])

  useEffect(() => {
    setState(loadState())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    setSaveError(saveState(state))
  }, [state, ready])

  const options = useMemo(() => {
    const merged = { ...defaultOptions(), ...state.options }
    for (const spec of specs) merged[spec.name] = clampOption(spec, merged[spec.name] ?? spec.pct)
    return merged
  }, [state.options, specs])

  const fabric = state.fabrics.find((item) => item.id === state.selectedFabricId) ?? null
  const capacity = fabric ? easeCapacity(fabric) : null
  const issues = measurementIssues(state.measurements)

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
          draftBibi({
            measurements: state.measurements,
            options,
            saMm: state.saMm,
            unit: state.unit,
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
  }, [ready, state.measurements, state.saMm, state.unit, options, issues.missing.length, issues.message])

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
          <p className="text-sm text-muted-foreground">Ashley Neale · Bibi knit top block · on this browser only</p>
        </div>
        <p className="max-w-sm text-xs text-muted-foreground">
          Formulas only. No account, no grading, no guesses about ease. Confirm the negative-ease range on a muslin.
        </p>
      </header>
      {saveError && (
        <p className="bg-destructive/10 px-4 py-2 text-sm text-destructive">Could not save: {saveError}</p>
      )}
      <div className="studio-shell">
        <aside className="studio-controls space-y-8 px-4 py-4">
          <FabricPanel
            fabrics={state.fabrics}
            selectedId={state.selectedFabricId}
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
            onUnit={(unit: Unit) => patch({ unit })}
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
                measurements: { ...values },
              }))
            }
          />
          <DraftPanel
            specs={specs}
            missing={missingNames}
            options={options}
            onOption={(name, value) =>
              setState((current) => ({
                ...current,
                options: { ...current.options, [name]: value },
              }))
            }
            saMm={state.saMm}
            onSa={(saMm) => patch({ saMm })}
            unit={state.unit}
            capacity={capacity}
            onUseRange={(chestPct) =>
              setState((current) => ({
                ...current,
                options: {
                  ...current.options,
                  chestEase: Math.max(chestEaseFloor(), chestPct),
                },
              }))
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
          />
        </main>
      </div>
    </div>
  )
}
