import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LengthField } from '@/components/LengthField'
import { LENGTH_LABEL, OPTION_BLURB } from '@/lib/copy'
import { exceedsCapacity, type EaseCapacity } from '@/lib/ease'
import { easeBandFor, type DesignId, type OptionSpec } from '@/lib/bibi'
import type { DraftResult } from '@/lib/bibi'
import { formatLength, formatPercent, type Unit } from '@/lib/units'

const EASE_NAMES = ['chestEase', 'waistEase', 'hipsEase', 'seatEase', 'kneeEase', 'neckEase', 'wristEase', 'sleeveEase']

export function DraftPanel({
  design,
  specs,
  missing,
  options,
  onOption,
  saMm,
  onSa,
  unit,
  capacity,
  onUseRange,
  onMatchStretch,
  result,
}: {
  design: DesignId
  specs: OptionSpec[]
  missing: string[]
  options: Record<string, number | boolean | string>
  onOption: (name: string, value: number | boolean | string) => void
  saMm: number
  onSa: (mm: number) => void
  unit: Unit
  capacity: EaseCapacity | null
  onUseRange: (chestPct: number) => void
  onMatchStretch: () => void
  result: DraftResult | null
}) {
  const byName = new Map(specs.map((spec) => [spec.name, spec]))
  const sleevesOn = options.sleeves !== false
  const fitWaist = options.fitWaist !== false
  const sleevePct = typeof options.sleeveLength === 'number' ? options.sleeveLength : 20
  const length = String(options.length ?? 'seat')
  const lengthBonus = typeof options.lengthBonus === 'number' ? options.lengthBonus : 0
  const showFlare =
    (length === 'waist' && lengthBonus > 0) ||
    length === 'hips' ||
    length === 'seat' ||
    length === 'knee' ||
    length === 'floor'
  const showCuffRib = sleevesOn && sleevePct >= 5
  const showRibbing = options.useWaistRibbing === true || (showCuffRib && options.useCuffRibbing === true)
  const chest = byName.get('chestEase')
  const band = easeBandFor(design)

  if (design !== 'bibi') {
    return (
      <section className="space-y-5">
        <header className="space-y-1">
          <h2 className="font-heading text-lg font-semibold">{design === 'shelly' ? 'Shelly draft' : 'Lily draft'}</h2>
          <p className="text-sm text-muted-foreground">
            {design === 'shelly'
              ? 'Raglan shirt from @freesewing/shelly. Controls are the real options. Raw constants armholeTweakFactor and bicepsPosition stay at the package values.'
              : 'Leggings from @freesewing/lily. fabricStretch is the horizontal stretch option. Lumira also exists at 4.10.2; Lily is used because it has fabricStretch.'}
          </p>
        </header>
        {missing.length > 0 && (
          <p className="rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive">
            Missing from the installed config: {missing.join(', ')}.
          </p>
        )}
        <ReductionCard design={design} result={result} unit={unit} />
        {design === 'lily' && (
          <Button type="button" variant="outline" size="sm" onClick={onMatchStretch}>
            Set waist, seat, and knee ease to fabricStretch ÷ −10
          </Button>
        )}
        <div className="space-y-3">
          {specs.map((spec) =>
            spec.kind === 'bool' ? (
              <BoolControl
                key={spec.name}
                spec={spec}
                value={options[spec.name] !== false && options[spec.name] !== 0}
                onChange={(value) => onOption(spec.name, value)}
              />
            ) : spec.kind === 'list' ? (
              <ListControl
                key={spec.name}
                spec={spec}
                value={String(options[spec.name] ?? spec.dflt)}
                onChange={(value) => onOption(spec.name, value)}
              />
            ) : (
              <PctControl
                key={spec.name}
                spec={spec}
                value={Number(options[spec.name] ?? spec.pct)}
                disabled={spec.name === 'hipsEase' && options.straightSides !== false}
                note={
                  spec.name === 'hipsEase' && options.straightSides !== false
                    ? 'Ignored while straightSides is on. Shelly uses chest ease for the hips.'
                    : undefined
                }
                capacity={capacity}
                band={band}
                result={result}
                unit={unit}
                onChange={(value) => onOption(spec.name, value)}
              />
            ),
          )}
        </div>
        {design === 'shelly' && options.straightSides !== false && (
          <p className="text-xs text-muted-foreground">
            straightSides is on, so Shelly drafts the hips from chest ease and ignores hipsEase.
          </p>
        )}
        <SaField saMm={saMm} onSa={onSa} unit={unit} />
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h2 className="font-heading text-lg font-semibold">Bibi draft</h2>
        <p className="text-sm text-muted-foreground">
          Knit top block from @freesewing/bibi. Every control below is a real option on that package, except seam allowance, which is the pattern setting <span className="font-medium">sa</span>.
        </p>
      </header>

      {missing.length > 0 && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          These names are not in the installed Bibi config, so they are not shown: {missing.join(', ')}.
        </p>
      )}

      <div className="space-y-2 rounded-lg border bg-accent/50 p-3 text-sm leading-relaxed">
        <p>
          Chest ease floors at {chest ? formatPercent(chest.min, 0) : '−5%'}. That minimum is <span className="font-medium">chestEase.min</span> in the package. FreeSewing core does not clamp it. This app clamps to the configured minimum before it drafts, and shows the value it sent.
        </p>
        <p>
          Knee and floor are length lines on the block. Bibi does not draft a dress: no walking ease, no closure, no skirt shaping. Those lengths still need design work. Blank waist-to-knee uses 1.5 × back waist length. Blank waist-to-floor uses 2.5 × back waist length.
        </p>
      </div>

      <ReductionCard design={design} result={result} unit={unit} />
      {capacity && chest && (
        <CapacityCard capacity={capacity} chestMin={chest.min} onUseRange={onUseRange} />
      )}
      {!capacity && (
        <p className="text-sm text-muted-foreground">
          Save a fabric and choose Use to compare these ease sliders with what that knit can hold. The draft still runs without one.
        </p>
      )}

      <Group title="Ease">
        {EASE_NAMES.map((name) => {
          const spec = byName.get(name)
          if (!spec) return null
          const disabled = name === 'waistEase' && !fitWaist
          return (
            <PctControl
              key={name}
              spec={spec}
              value={Number(options[name] ?? spec.pct)}
              disabled={disabled}
              note={disabled ? 'Not applied while fit waist is off. Bibi hides this control in that case.' : undefined}
              capacity={capacity}
              band="fittedTop"
              result={result}
              unit={unit}
              onChange={(value) => onOption(name, value)}
            />
          )
        })}
        <BoolControl
          spec={byName.get('fitWaist')}
          value={fitWaist}
          onChange={(value) => onOption('fitWaist', value)}
        />
        <BoolControl
          spec={byName.get('draftForHighBust')}
          value={options.draftForHighBust !== false}
          onChange={(value) => onOption('draftForHighBust', value)}
        />
        {options.draftForHighBust !== false && (
          <PctControl
            spec={byName.get('bustEase')}
            value={Number(options.bustEase ?? 0)}
            result={result}
            unit={unit}
            band="fittedTop"
            onChange={(value) => onOption('bustEase', value)}
          />
        )}
      </Group>

      <Group title="Sleeves">
        <BoolControl spec={byName.get('sleeves')} value={sleevesOn} onChange={(value) => onOption('sleeves', value)} />
        {sleevesOn ? (
          <>
            <PctControl
              spec={byName.get('sleeveLength')}
              value={sleevePct}
              result={result}
              unit={unit}
              onChange={(value) => onOption('sleeveLength', value)}
            />
            <PctControl
              spec={byName.get('cuffEase')}
              value={Number(options.cuffEase ?? 20)}
              result={result}
              unit={unit}
              onChange={(value) => onOption('cuffEase', value)}
            />
          </>
        ) : (
          <>
            <PctControl
              spec={byName.get('strapWidth')}
              value={Number(options.strapWidth ?? 40)}
              result={result}
              unit={unit}
              onChange={(value) => onOption('strapWidth', value)}
            />
            <PctControl
              spec={byName.get('armholeCurveFront')}
              value={Number(options.armholeCurveFront ?? 15)}
              result={result}
              unit={unit}
              onChange={(value) => onOption('armholeCurveFront', value)}
            />
            <PctControl
              spec={byName.get('armholeCurveBack')}
              value={Number(options.armholeCurveBack ?? 30)}
              result={result}
              unit={unit}
              onChange={(value) => onOption('armholeCurveBack', value)}
            />
            <PctControl
              spec={byName.get('armholeDropBack')}
              value={Number(options.armholeDropBack ?? 20)}
              result={result}
              unit={unit}
              onChange={(value) => onOption('armholeDropBack', value)}
            />
          </>
        )}
      </Group>

      <Group title="Length and flare">
        <ListControl spec={byName.get('length')} value={length} onChange={(value) => onOption('length', value)} />
        {(length === 'knee' || length === 'floor') && (
          <p className="text-sm text-destructive">
            {length === 'knee' ? 'Knee' : 'Floor'} length is a hem line on the block, not a finished dress.
          </p>
        )}
        <PctControl
          spec={byName.get('lengthBonus')}
          value={lengthBonus}
          result={result}
          unit={unit}
          onChange={(value) => onOption('lengthBonus', value)}
        />
        <PctControl
          spec={byName.get('flare')}
          value={Number(options.flare ?? 0)}
          disabled={!showFlare}
          note={showFlare ? undefined : 'Flare stays at 0 until the hem is below the waist. That matches Bibi’s menu rule.'}
          result={result}
          unit={unit}
          onChange={(value) => onOption('flare', value)}
        />
      </Group>

      <Group title="Neckline">
        {['necklineWidth', 'necklineDepth', 'necklineBend', 'backNeckCutout', 'backNeckBend'].map((name) => (
          <PctControl
            key={name}
            spec={byName.get(name)}
            value={Number(options[name] ?? 0)}
            result={result}
            unit={unit}
            onChange={(value) => onOption(name, value)}
          />
        ))}
        <p className="text-xs text-muted-foreground">
          There is no single option named neckline. These five are the neckline controls in the package.
        </p>
      </Group>

      <Group title="Ribbing and binding">
        <BoolControl
          spec={byName.get('useWaistRibbing')}
          value={options.useWaistRibbing === true}
          onChange={(value) => onOption('useWaistRibbing', value)}
        />
        {showCuffRib && (
          <BoolControl
            spec={byName.get('useCuffRibbing')}
            value={options.useCuffRibbing === true}
            onChange={(value) => onOption('useCuffRibbing', value)}
          />
        )}
        {showRibbing && (
          <>
            <PctControl
              spec={byName.get('ribbingStretch')}
              value={Number(options.ribbingStretch ?? 15)}
              result={result}
              unit={unit}
              onChange={(value) => onOption('ribbingStretch', value)}
            />
            <PctControl
              spec={byName.get('ribbingHeight')}
              value={Number(options.ribbingHeight ?? 10)}
              result={result}
              unit={unit}
              onChange={(value) => onOption('ribbingHeight', value)}
            />
          </>
        )}
        <PctControl
          spec={byName.get('bindingHeight')}
          value={Number(options.bindingHeight ?? 2.5)}
          result={result}
          unit={unit}
          onChange={(value) => onOption('bindingHeight', value)}
        />
        <p className="text-xs text-muted-foreground">
          Ribbing is useWaistRibbing, useCuffRibbing, ribbingStretch, and ribbingHeight. The neck and armhole strip is bindingHeight, not a separate ribbing option.
        </p>
      </Group>

      <SaField saMm={saMm} onSa={onSa} unit={unit} />
    </section>
  )
}

function CapacityCard({
  capacity,
  chestMin,
  onUseRange,
}: {
  capacity: EaseCapacity
  chestMin: number
  onUseRange: (pct: number) => void
}) {
  const mid = (capacity.fittedTop.moreNegative + capacity.fittedTop.closerToZero) / 2
  const clamped = Math.max(chestMin, mid)
  return (
    <div className="space-y-2 rounded-lg border bg-card p-3 text-sm leading-relaxed">
      <p className="font-medium">Negative ease for this fabric</p>
      <p>
        A starting point to confirm on a muslin. Circumference uses crosswise stretch. Lengthwise stretch is recorded for 2-way versus 4-way and is not applied to this draft.
      </p>
      <ul className="space-y-1 text-xs sm:text-sm">
        <li>Crosswise stretch {formatPercent(capacity.crosswisePct)} · scale {capacity.scale.toFixed(3)} from stretchToScale</li>
        <li>Lengthwise stretch {formatPercent(capacity.lengthwisePct)} · scale {capacity.lengthwiseScale.toFixed(3)}</li>
        <li>If the pattern used every bit of crosswise stretch, ease would be {formatPercent(capacity.fullEasePct)}.</li>
        <li>
          Fitted top, 25–45% of that ease
          {capacity.recoveryFactor < 1 ? `, times recovery ${capacity.recoveryFactor.toFixed(2)}` : ''}:{' '}
          {formatPercent(capacity.fittedTop.moreNegative)} to {formatPercent(capacity.fittedTop.closerToZero)}
        </li>
        <li>
          Leggings, 50–70% of that ease, not drafted here:{' '}
          {formatPercent(capacity.leggings.moreNegative)} to {formatPercent(capacity.leggings.closerToZero)}
        </li>
        {capacity.poorRecovery && (
          <li>Poor recovery (recovered mark is 10.5 cm or more). The ranges are pulled toward zero.</li>
        )}
      </ul>
      <Button type="button" size="sm" variant="outline" onClick={() => onUseRange(Math.round(clamped * 10) / 10)}>
        Set chest ease to {formatPercent(clamped)}
      </Button>
      {clamped > mid + 0.05 && (
        <p className="text-xs text-muted-foreground">
          The middle of the fitted range is {formatPercent(mid)}, which is below Bibi’s chest ease floor of {formatPercent(chestMin, 0)}. The button uses the floor.
        </p>
      )}
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function PctControl({
  spec,
  value,
  onChange,
  disabled,
  note,
  capacity,
  result,
  unit,
  band = 'fittedTop',
}: {
  spec: OptionSpec | undefined
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  note?: string
  capacity?: EaseCapacity | null
  result: DraftResult | null
  unit: Unit
  band?: 'fittedTop' | 'leggings'
}) {
  if (!spec || spec.kind !== 'pct') return null
  const applied = result ? result.options[spec.name] : null
  const appliedPct = typeof applied === 'number' ? applied * 100 : value
  const absolute = result?.absoluteOptions[spec.name]
  const warn = !!capacity && EASE_NAMES.includes(spec.name) && !disabled && exceedsCapacity(appliedPct, capacity, band)
  const range = capacity ? capacity[band] : null
  return (
    <div className={`space-y-1.5 ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={spec.name}>{spec.name}</Label>
        <span className="text-sm font-medium tabular-nums">{formatPercent(value)}</span>
      </div>
      <Slider
        id={spec.name}
        min={spec.min}
        max={spec.max}
        step={0.5}
        value={[value]}
        disabled={disabled}
        onValueChange={(next) => onChange(next[0] ?? value)}
      />
      <p className="text-xs text-muted-foreground">{OPTION_BLURB[spec.name]}</p>
      <p className="text-xs">
        Package default {formatPercent(spec.pct, spec.pct % 1 === 0 ? 0 : 1)}, range {formatPercent(spec.min, 0)} to {formatPercent(spec.max, 0)}.
        {' '}Applied {formatPercent(appliedPct)}
        {typeof absolute === 'number' ? ` · ${formatLength(absolute, unit)} absolute` : ''}.
      </p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {warn && range && (
        <p className="text-xs text-destructive">
          {formatPercent(appliedPct)} is more negative than this fabric’s {band === 'leggings' ? 'leggings' : 'fitted top'} range of {formatPercent(range.moreNegative)} to {formatPercent(range.closerToZero)}. The draft still uses {formatPercent(appliedPct)}. Confirm it on a muslin.
        </p>
      )}
    </div>
  )
}

function BoolControl({
  spec,
  value,
  onChange,
}: {
  spec: OptionSpec | undefined
  value: boolean
  onChange: (value: boolean) => void
}) {
  if (!spec) return null
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-card px-3 py-2">
      <div>
        <Label htmlFor={spec.name}>{spec.name}</Label>
        <p className="text-xs text-muted-foreground">{OPTION_BLURB[spec.name]}</p>
        <p className="text-xs">Package default {spec.bool ? 'on' : 'off'}. Applied {value ? 'on' : 'off'}.</p>
      </div>
      <Switch id={spec.name} checked={value} onCheckedChange={onChange} />
    </div>
  )
}

function ListControl({
  spec,
  value,
  onChange,
}: {
  spec: OptionSpec | undefined
  value: string
  onChange: (value: string) => void
}) {
  if (!spec || spec.kind !== 'list') return null
  return (
    <div className="space-y-1.5">
      <Label>{spec.name}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {spec.list.map((item) => (
            <SelectItem key={item} value={item}>
              {LENGTH_LABEL[item] ?? item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{OPTION_BLURB[spec.name]}</p>
      <p className="text-xs">Package default {spec.dflt}. Applied {value}.</p>
    </div>
  )
}

function ReductionCard({ design, result, unit }: { design: DesignId; result: DraftResult | null; unit: Unit }) {
  const reduction = result?.reduction
  if (!reduction) {
    return (
      <p className="text-sm text-muted-foreground">
        Vertical length reduction appears with the draft. It uses lengthwise stretch and only runs for a 4-way fabric.
      </p>
    )
  }
  return (
    <div className="space-y-2 rounded-lg border bg-card p-3 text-sm leading-relaxed">
      <p className="font-medium">4-way vertical length reduction</p>
      <p>{reduction.reason}</p>
      <ul className="space-y-1 text-xs sm:text-sm">
        <li>Lengthwise stretch {formatPercent(reduction.lengthwisePct)} · scale {reduction.lengthwiseScale.toFixed(3)}</li>
        <li>Full reduction if every bit of that stretch were used: {formatPercent(reduction.fullReductionPct)}</li>
        <li>
          Working reduction, half of that times recovery {reduction.recoveryFactor.toFixed(2)}: {formatPercent(reduction.appliedPct)}
        </li>
      </ul>
      {result.lengths.length > 0 ? (
        <ul className="space-y-1 text-xs">
          {result.lengths.map((row) => (
            <li key={row.name}>
              {row.name}: {formatLength(row.originalMm, unit)} → {formatLength(row.appliedMm, unit)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs">No vertical length was changed. Applied reduction {formatPercent(reduction.appliedPct)}.</p>
      )}
      <p className="text-xs text-muted-foreground">
        {design === 'lily'
          ? 'This percent is sent as Lily’s lengthReduction option, which shortens the leg from waistToFloor.'
          : 'Bibi and Shelly have no lengthReduction option, so this percent shortens the vertical measurements before the draft.'}{' '}
        Ease percentages stay percentages.
      </p>
    </div>
  )
}

function SaField({ saMm, onSa, unit }: { saMm: number; onSa: (mm: number) => void; unit: Unit }) {
  return (
    <div className="space-y-1">
      <LengthField
        id="sa"
        label="Seam allowance"
        mm={saMm}
        unit={unit}
        onMm={(mm) => {
          if (mm == null) return
          onSa(Math.min(25.4, Math.max(0, mm)))
        }}
        hint="Not a design option. FreeSewing reads settings.sa in millimetres. A fresh browser starts at 3/8 in (9.525 mm). The field shows that length in the active unit, and the draft receives the millimetre value."
      />
      <p className="text-xs">FreeSewing receives {saMm} mm, which is {formatLength(saMm, unit)}.</p>
    </div>
  )
}
