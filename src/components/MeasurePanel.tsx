import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LengthField } from '@/components/LengthField'
import { MEASUREMENT_COPY, MEASUREMENT_ORDER } from '@/lib/copy'
import { exampleMeasurements, type DesignId } from '@/lib/bibi'
import type { Unit } from '@/lib/units'

export function MeasurePanel({
  unit,
  design,
  required,
  optional,
  measurements,
  onChange,
  onExample,
}: {
  unit: Unit
  design: DesignId
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
          These are the measurements {design === 'bibi' ? 'Bibi' : design === 'shelly' ? 'Shelly' : 'Lily'} asks for. Lengths are stored in millimetres and shown in {unit === 'in' ? 'inches' : 'centimetres'}. Shoulder slope stays in degrees.
        </p>
      </header>
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
              onExample(exampleMeasurements(design))
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
  if (!degrees) {
    return (
      <div className="space-y-1">
        <LengthField
          id={`m-${name}`}
          label={`${copy?.title ?? name}${required ? '' : ' (optional)'}`}
          mm={value}
          unit={unit}
          onMm={(mm) => onChange(name, mm)}
          hint={copy?.how ?? 'This design asks for this length.'}
        />
      </div>
    )
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`m-${name}`}>{copy?.title ?? name}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={`m-${name}`}
          className="max-w-36"
          type="number"
          inputMode="decimal"
          step={0.5}
          min={0}
          value={value == null ? '' : String(Math.round(value * 10) / 10)}
          onChange={(event) => {
            if (event.target.value === '') {
              onChange(name, null)
              return
            }
            const next = Number(event.target.value)
            if (Number.isFinite(next)) onChange(name, next)
          }}
        />
        <span className="text-sm text-muted-foreground">degrees</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{copy?.how}</p>
    </div>
  )
}
