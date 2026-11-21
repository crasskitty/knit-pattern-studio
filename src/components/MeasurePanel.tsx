import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MEASUREMENT_COPY, MEASUREMENT_ORDER } from '@/lib/copy'
import { exampleMeasurements } from '@/lib/bibi'
import type { Unit } from '@/lib/units'
import { fromMm, toMm } from '@/lib/units'

export function MeasurePanel({
  unit,
  onUnit,
  required,
  optional,
  measurements,
  onChange,
  onExample,
}: {
  unit: Unit
  onUnit: (unit: Unit) => void
  required: string[]
  optional: string[]
  measurements: Record<string, number | null>
  onChange: (name: string, value: number | null) => void
  onExample: (values: Record<string, number>) => void
}) {
  const [confirmExample, setConfirmExample] = useState(false)
  const ordered = (names: string[]) =>
    [...names].sort((a, b) => {
      const ai = MEASUREMENT_ORDER.indexOf(a as (typeof MEASUREMENT_ORDER)[number])
      const bi = MEASUREMENT_ORDER.indexOf(b as (typeof MEASUREMENT_ORDER)[number])
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
  const hasAny = Object.values(measurements).some((value) => value != null)

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="font-heading text-lg font-semibold">Measurements</h2>
        <p className="text-sm text-muted-foreground">
          These are the measurements Bibi’s config asks for. Stored in millimetres. The toggle only changes the display.
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm">Unit</span>
        <Button type="button" size="sm" variant={unit === 'cm' ? 'default' : 'outline'} onClick={() => onUnit('cm')}>
          Centimetres
        </Button>
        <Button type="button" size="sm" variant={unit === 'in' ? 'default' : 'outline'} onClick={() => onUnit('in')}>
          Inches
        </Button>
      </div>
      {required.length === 0 ? (
        <p className="text-sm text-destructive">Bibi did not report any required measurements. The package did not load.</p>
      ) : (
        <div className="space-y-3">
          {ordered(required).map((name) => (
            <MeasureField
              key={name}
              name={name}
              required
              unit={unit}
              value={measurements[name] ?? null}
              onChange={onChange}
            />
          ))}
        </div>
      )}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Optional, used when you fill them in</h3>
        {optional.length === 0 && <p className="text-sm text-muted-foreground">None on this design.</p>}
        {ordered(optional).map((name) => (
          <MeasureField
            key={name}
            name={name}
            unit={unit}
            value={measurements[name] ?? null}
            onChange={onChange}
          />
        ))}
      </div>
      <div className="space-y-2 rounded-lg border border-dashed p-3">
        <p className="text-sm">
          The FreeSewing models package includes a size 38 example (cis female proportions). It is not your body. Use it only to see a draft.
        </p>
        {confirmExample || !hasAny ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onExample(exampleMeasurements())
              setConfirmExample(false)
            }}
          >
            {hasAny ? 'Replace with the size 38 example' : 'Load the size 38 example'}
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={() => setConfirmExample(true)}>
            Replace with the size 38 example
          </Button>
        )}
      </div>
    </section>
  )
}

function MeasureField({
  name,
  required,
  unit,
  value,
  onChange,
}: {
  name: string
  required?: boolean
  unit: Unit
  value: number | null
  onChange: (name: string, value: number | null) => void
}) {
  const copy = MEASUREMENT_COPY[name]
  const degrees = name === 'shoulderSlope'
  const shown =
    value == null
      ? ''
      : degrees
        ? String(Math.round(value * 10) / 10)
        : String(roundDisplay(fromMm(value, unit), unit))
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`m-${name}`}>
        {copy?.title ?? name}
        {required ? '' : ' (optional)'}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={`m-${name}`}
          className="max-w-36"
          type="number"
          inputMode="decimal"
          step={degrees ? 0.5 : unit === 'cm' ? 0.1 : 0.125}
          min={0}
          value={shown}
          onChange={(event) => {
            if (event.target.value === '') {
              onChange(name, null)
              return
            }
            const next = Number(event.target.value)
            if (!Number.isFinite(next)) return
            onChange(name, degrees ? next : toMm(next, unit))
          }}
        />
        <span className="text-sm text-muted-foreground">{degrees ? 'degrees' : unit}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {copy?.how ?? 'Bibi asks for this measurement. Enter it in the unit shown.'}
      </p>
    </div>
  )
}

function roundDisplay(value: number, unit: Unit) {
  const digits = unit === 'cm' ? 2 : 3
  return Math.round(value * 10 ** digits) / 10 ** digits
}
