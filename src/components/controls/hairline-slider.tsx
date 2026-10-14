// A hairline slider (DESIGN.md "Working pages"): a 1px track, a small hollow thumb, the value in mono beside
// it. No fill, no knob shadow. Shared by /scanner's net floor and /den's book and what-ifs.
import { Slider } from "radix-ui"
import { useId } from "react"
import { cn } from "@/lib/cn"

type Props = {
  label: string
  value: number
  min: number
  max: number
  step: number
  /** The value as words, e.g. "72 h" (also read out by screen readers). */
  text: string
  onChange: (v: number) => void
  className?: string
  /** Fixed label and value widths, so stacked sliders line up; the track takes the rest. */
  labelClass?: string
  valueClass?: string
}

export function HairlineSlider({ label, value, min, max, step, text, onChange, className, labelClass, valueClass }: Props) {
  const id = useId()
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span id={id} className={cn("label shrink-0 text-starlight-dim", labelClass)}>
        {label}
      </span>
      <Slider.Root
        aria-labelledby={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className={cn("relative flex h-11 touch-none items-center select-none", labelClass ? "min-w-16 grow" : "w-40 shrink-0")}
      >
        <Slider.Track className="relative h-px grow bg-starlight-faint" />
        <Slider.Thumb
          aria-valuetext={text}
          className="block size-3 rounded-full border border-starlight bg-void outline-none focus-visible:border-scan focus-visible:ring-1 focus-visible:ring-scan"
        />
      </Slider.Root>
      <span className={cn("label shrink-0 tabular-nums text-starlight", valueClass)}>{text}</span>
    </div>
  )
}
