import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  displayToRecovered,
  easeCapacity,
  gaugeInUnit,
  poorRecoveryInUnit,
  recoveredToDisplay,
} from '@/lib/ease'
import { parseInches, parseCentimetres } from '@/lib/fractions'
import type { Fabric, FabricDirection } from '@/lib/storage'
import { formatPercent, type Unit } from '@/lib/units'

type Draft = Omit<Fabric, 'id'>

const blank = (): Draft => ({
  name: '',
  crosswisePct: 0,
  lengthwisePct: 0,
  recoveredCm: 10,
  direction: '2-way',
  notes: '',
})

export function FabricPanel({
  fabrics,
  selectedId,
  unit,
  onSave,
  onDelete,
  onSelect,
}: {
  fabrics: Fabric[]
  selectedId: string | null
  unit: Unit
  onSave: (fabric: Fabric) => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Draft>(blank())
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [guideOpen, setGuideOpen] = useState(true)

  function beginNew() {
    setEditingId(null)
    setForm(blank())
    setError(null)
  }

  function beginEdit(fabric: Fabric) {
    setEditingId(fabric.id)
    setForm({
      name: fabric.name,
      crosswisePct: fabric.crosswisePct,
      lengthwisePct: fabric.lengthwisePct,
      recoveredCm: fabric.recoveredCm,
      direction: fabric.direction,
      notes: fabric.notes,
    })
    setError(null)
  }

  function save() {
    const name = form.name.trim()
    if (!name) {
      setError('Name the fabric so you can tell the swatches apart.')
      return
    }
    if (form.crosswisePct < 0 || form.lengthwisePct < 0 || form.crosswisePct > 250 || form.lengthwisePct > 250) {
      setError('Stretch percent has to be between 0 and 250.')
      return
    }
    if (form.recoveredCm < 9 || form.recoveredCm > 16) {
      setError('Recovered length is the 10 cm marks after you let go. Enter that length in centimetres.')
      return
    }
    onSave({
      id: editingId ?? crypto.randomUUID(),
      ...form,
      name,
    })
    beginNew()
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="font-heading text-lg font-semibold">Fabric</h2>
        <p className="text-sm text-muted-foreground">
          Wash and dry it the way it will be worn, then record the stretch test. Saved on this browser only.
        </p>
      </header>

      <div className="rounded-lg border bg-card">
        <button
          type="button"
          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
          onClick={() => setGuideOpen((open) => !open)}
          aria-expanded={guideOpen}
        >
          Stretch test
          <span className="text-muted-foreground">{guideOpen ? 'Hide' : 'Show'}</span>
        </button>
        {guideOpen && (
          <ol className="list-decimal space-y-2 border-t px-7 py-3 text-sm leading-relaxed">
            <li>Wash and dry the fabric the way the garment will be worn.</li>
            <li>Fold along the greatest stretch, a few inches in from the selvage.</li>
            <li>Mark {unit === 'in' ? '4 in' : '10 cm'}. Those two marks are the same test, not a converted length.</li>
            <li>Hold the left mark at a ruler. Stretch until the fabric resists. Stop before it thins.</li>
            <li>
              Record where the right mark lands. One and a half times the mark is 50% stretch. Percent is (landed − mark) ÷ mark × 100.
            </li>
            <li>
              Let go and measure the marks again. If they are still {poorRecoveryInUnit(unit)} {unit} or more, recovery is poor.
            </li>
            <li>Repeat along the length. Stretch both ways is 4-way. Stretch one way is 2-way.</li>
          </ol>
        )}
      </div>

      {fabrics.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
          No fabrics saved yet. Run the test, then keep the numbers here.
        </p>
      ) : (
        <ul className="space-y-2">
          {fabrics.map((fabric) => {
            const capacity = easeCapacity(fabric)
            const selected = fabric.id === selectedId
            return (
              <li key={fabric.id} className={`rounded-lg border p-3 ${selected ? 'border-primary bg-accent/40' : 'bg-card'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <button type="button" className="text-left" onClick={() => onSelect(fabric.id)}>
                    <span className="block font-medium">{fabric.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {fabric.direction} · crosswise {formatPercent(fabric.crosswisePct, 0)} · lengthwise{' '}
                      {formatPercent(fabric.lengthwisePct, 0)} · recovered {recoveredToDisplay(fabric.recoveredCm, unit).toFixed(2)} {unit}
                      {capacity.poorRecovery ? ' · poor recovery' : ''}
                    </span>
                  </button>
                  <div className="flex gap-1">
                    <Button type="button" size="sm" variant={selected ? 'default' : 'outline'} onClick={() => onSelect(fabric.id)}>
                      {selected ? 'Using' : 'Use'}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => beginEdit(fabric)}>
                      Edit
                    </Button>
                    {pendingDelete === fabric.id ? (
                      <Button type="button" size="sm" variant="destructive" onClick={() => onDelete(fabric.id)}>
                        Confirm delete
                      </Button>
                    ) : (
                      <Button type="button" size="sm" variant="ghost" onClick={() => setPendingDelete(fabric.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
                {fabric.notes && <p className="mt-2 text-sm text-muted-foreground">{fabric.notes}</p>}
              </li>
            )
          })}
        </ul>
      )}

      <form
        className="space-y-3 rounded-lg border bg-card p-3"
        onSubmit={(event) => {
          event.preventDefault()
          save()
        }}
      >
        <h3 className="text-sm font-medium">{editingId ? 'Edit fabric' : 'Save a fabric'}</h3>
        <div className="space-y-1.5">
          <Label htmlFor="fabric-name">Name</Label>
          <Input
            id="fabric-name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Black cotton jersey"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <PercentField
            id="crosswise"
            label="Crosswise stretch"
            value={form.crosswisePct}
            onChange={(crosswisePct) => setForm({ ...form, crosswisePct })}
          />
          <PercentField
            id="lengthwise"
            label="Lengthwise stretch"
            value={form.lengthwisePct}
            onChange={(lengthwisePct) => setForm({ ...form, lengthwisePct })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          If you wrote down the ruler instead of a percent, type where the 10 cm mark landed.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <MarkField
            id="cross-mark"
            label={`Crosswise mark landed (${unit})`}
            unit={unit}
            onLanded={(value) =>
              setForm({ ...form, crosswisePct: round1(((value - gaugeInUnit(unit)) / gaugeInUnit(unit)) * 100) })
            }
          />
          <MarkField
            id="length-mark"
            label={`Lengthwise mark landed (${unit})`}
            unit={unit}
            onLanded={(value) =>
              setForm({ ...form, lengthwisePct: round1(((value - gaugeInUnit(unit)) / gaugeInUnit(unit)) * 100) })
            }
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <RecoveredField
            unit={unit}
            recoveredCm={form.recoveredCm}
            onChange={(recoveredCm) => setForm({ ...form, recoveredCm })}
          />
          <div className="space-y-1.5">
            <Label htmlFor="direction">Direction</Label>
            <select
              id="direction"
              className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
              value={form.direction}
              onChange={(event) => setForm({ ...form, direction: event.target.value as FabricDirection })}
            >
              <option value="2-way">2-way</option>
              <option value="4-way">4-way</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Washed hot, tumble dried. Greatest stretch is crosswise."
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit">{editingId ? 'Update fabric' : 'Save fabric'}</Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={beginNew}>
              Cancel edit
            </Button>
          )}
        </div>
      </form>
    </section>
  )
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}

function PercentField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label} %</Label>
      <Input
        id={id}
        type="number"
        min={0}
        max={250}
        step={0.5}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}

function MarkField({
  id,
  label,
  unit,
  onLanded,
}: {
  id: string
  label: string
  unit: Unit
  onLanded: (value: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder={unit === 'in' ? '6' : '15'}
        onChange={(event) => {
          const parsed = unit === 'in' ? parseInches(event.target.value) : parseCentimetres(event.target.value)
          if (parsed == null) return
          onLanded(parsed)
        }}
      />
    </div>
  )
}

function RecoveredField({
  unit,
  recoveredCm,
  onChange,
}: {
  unit: Unit
  recoveredCm: number
  onChange: (recoveredCm: number) => void
}) {
  const shown = String(Math.round(recoveredToDisplay(recoveredCm, unit) * 1000) / 1000)
  const [text, setText] = useState(shown)
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) setText(shown)
  }, [shown, focused])
  return (
    <div className="space-y-1.5">
      <Label htmlFor="recovered">Recovered length ({unit})</Label>
      <Input
        id="recovered"
        value={focused ? text : shown}
        onFocus={() => {
          setFocused(true)
          setText(shown)
        }}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          setFocused(false)
          const parsed = unit === 'in' ? parseInches(text) : parseCentimetres(text)
          if (parsed == null) {
            setText(shown)
            return
          }
          onChange(displayToRecovered(parsed, unit))
        }}
      />
    </div>
  )
}
