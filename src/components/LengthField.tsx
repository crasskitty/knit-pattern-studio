import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatLengthValue, parseLengthToMm } from '@/lib/fractions'
import type { Unit } from '@/lib/units'

export function LengthField({
  id,
  label,
  mm,
  unit,
  onMm,
  hint,
}: {
  id: string
  label: string
  mm: number | null
  unit: Unit
  onMm: (mm: number | null) => void
  hint?: string
}) {
  const shown = mm == null || !Number.isFinite(mm) ? '' : formatLengthValue(mm, unit)
  const [text, setText] = useState(shown)
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!focused) setText(shown)
  }, [shown, focused])

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          className="max-w-36"
          inputMode="decimal"
          value={focused ? text : shown}
          onFocus={() => {
            setFocused(true)
            setText(shown)
            setError(null)
          }}
          onChange={(event) => setText(event.target.value)}
          onBlur={() => {
            setFocused(false)
            if (text.trim() === '') {
              onMm(null)
              setError(null)
              return
            }
            const parsed = parseLengthToMm(text, unit)
            if (parsed == null) {
              setError(unit === 'in' ? 'Use a decimal or a fraction such as 3/8 or 1 1/2.' : 'Use a decimal number of centimetres.')
              setText(shown)
              return
            }
            setError(null)
            onMm(parsed)
          }}
        />
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
