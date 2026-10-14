// κ Ledger (PLAN §3 κ, TICKETS T27): the last chapter. Owner decisions: (a) the sky dims and (P3 close)
// Canis Major re-forms around Sirius as the last image,
// (b) the same links as the nav, (c) P3 closes with a full critique before the v0.4 tag.
// - copy: <Chapter> ("Paper only." and the disclaimer), centred mid-screen, nothing blurs out after it;
// - Canis Major re-forms above it around Sirius (objects/canis-major.tsx, placed by ledger-scene.ts);
// - the ledger footer below: where the figures come from (with a tag), the phase, the links, a way back
//   to the overture, ©. It is real, focusable page content (not inside the aria-hidden copy block).
import { Link } from "@tanstack/react-router"
import { useRef } from "react"
import { band } from "@/lib/motion/math"
import { scrollToTarget } from "@/lib/motion/scroll-bus"
import { SCANNER_ADDRESS, sourceLine } from "@/lib/scan/source"
import { useScan } from "@/lib/scan/use-scan"
import type { ChapterDef } from "@/content/edition"
import { Chapter } from "../edition/chapter"
import { applyLook } from "../edition/look"
import { SourceTag } from "../edition/source-tag"
import { useScrollFrame } from "../edition/use-scroll-frame"

type Props = { def: ChapterDef; exitInto?: string; last?: boolean }

const LINKS = [
  { to: "/", label: "Edition" },
  { to: "/universe", label: "Sky" },
  { to: "/den", label: "Den" },
] as const

export function Ledger({ def, exitInto, last }: Props) {
  const scan = useScan()
  const foot = useRef<HTMLElement>(null)

  useScrollFrame((s) => {
    const p = s.sections.ledger ?? 0
    const o = s.reduced ? (p > 0 ? 1 : 0) : band(p, 0.28, 0.48)
    applyLook(foot.current, { opacity: o, y: (1 - o) * 12, blur: 0 })
  })

  return (
    <>
      <Chapter def={def} exitInto={exitInto} last={last} />
      <footer
        ref={foot}
        aria-label="Ledger"
        className="label pointer-events-none fixed inset-x-0 bottom-[5svh] z-20 grid justify-items-center gap-2 px-4 text-center text-starlight-dim"
        style={{ visibility: "hidden" }}
      >
        <p className="m-0 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1.5">
          <span>{sourceLine(scan)}</span>
          <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />
        </p>
        <p className="m-0">scanner at {SCANNER_ADDRESS}</p>
        <p className="m-0">Phase 0 · paper only · no order code · no exchange keys</p>
        <nav aria-label="Pages" className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-6">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="inline-flex min-h-11 items-center text-starlight hover:text-scan focus-visible:text-scan">
              {l.label}
            </Link>
          ))}
          {/* The way home, mirroring the overture's "↓ α" cue. */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("chapter-overture")
              if (el) scrollToTarget(el)
            }}
            className="label inline-flex min-h-11 items-center text-starlight-dim hover:text-starlight focus-visible:text-scan"
          >
            ↑ back to the overture
          </button>
        </nav>
        <p className="m-0">© 2026 HedgeHound</p>
      </footer>
    </>
  )
}
