// D2 prototype only (the rhythm round): three switches the owner flips while scrolling, kept in the URL
// (?seams=&handover=&pace=) so a combination can be shared. Removed once the owner picks.
import { useEffect, useState } from "react"
import { cn } from "@/lib/cn"
import { HANDOVERS, PACES, SEAMS, useRhythm, type Rhythm } from "@/lib/stage/rhythm"

const ROWS: Array<{ key: keyof Rhythm; label: string; options: readonly string[] }> = [
  { key: "seams", label: "seams", options: SEAMS },
  { key: "handover", label: "handover", options: HANDOVERS },
  { key: "pace", label: "pace", options: PACES },
]

export function RhythmPanel() {
  const rhythm = useRhythm((r) => r.rhythm)
  const [open, setOpen] = useState(true)
  // Collapsed on phones, where it would sit over the copy.
  useEffect(() => setOpen(window.innerWidth >= 768), [])
  const pick = (key: keyof Rhythm, value: string) => {
    const next = { ...rhythm, [key]: value } as Rhythm
    useRhythm.getState().set(next)
    const q = new URLSearchParams(window.location.search)
    q.set(key, value)
    window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`)
  }
  return (
    <aside aria-label="Rhythm prototype switches" className="label fixed right-[max(16px,7vw)] bottom-16 z-30 grid justify-items-end gap-1.5 text-starlight-dim">
      <button type="button" onClick={() => setOpen(!open)} className="inline-flex min-h-8 items-center text-starlight-dim hover:text-starlight">
        rhythm (prototype) {open ? "▾" : "▸"}
      </button>
      {open &&
        ROWS.map((row) => (
          <div key={row.key} className="flex items-baseline gap-2">
            <span>{row.label}</span>
            {row.options.map((o) => (
              <button
                key={o}
                type="button"
                aria-pressed={rhythm[row.key] === o}
                onClick={() => pick(row.key, o)}
                className={cn(
                  "inline-flex min-h-8 items-center border-b px-0.5",
                  rhythm[row.key] === o ? "border-scan text-starlight" : "border-transparent text-starlight-dim hover:text-starlight",
                )}
              >
                {o}
              </button>
            ))}
          </div>
        ))}
    </aside>
  )
}
