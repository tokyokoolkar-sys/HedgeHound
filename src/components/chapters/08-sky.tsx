// θ The Sky (PLAN §3 θ, TICKETS T25). Owner decisions: (a) the atlas now, the "Enter the sky" portal with
// T33 (when /sky exists), (b) recap labels with each chapter's letter, (c) title and subtitle only.
// - copy: <Chapter> (title + subtitle, a quiet breath);
// - instrument: objects/atlas.tsx (every coin, filling the sky), channels in sky-scene.ts;
// - labels: each earlier chapter's key coin, picked by those chapters' own rules (lib/stage/atlas.ts), and a
//   caption that counts the field and η's skipped coins, with one SourceTag.
import { Fragment, useRef } from "react"
import { cn } from "@/lib/cn"
import { pickLoudest } from "@/lib/scan/loudest"
import { useScan } from "@/lib/scan/use-scan"
import { atlasToWorld, placeAtlas, recap } from "@/lib/stage/atlas"
import { steadiestRows } from "@/lib/stage/comet"
import { REASONS, skippedLists } from "@/lib/stage/embers"
import { shortlist } from "@/lib/stage/field"
import { KENNEL, type ChapterDef } from "@/content/edition"
import { Chapter } from "../edition/chapter"
import { applyLook } from "../edition/look"
import { ProjectedLabel } from "../edition/projected-label"
import { SourceTag } from "../edition/source-tag"
import { useScrollFrame } from "../edition/use-scroll-frame"

type Props = { def: ChapterDef; exitInto?: string; last?: boolean }

export function Sky({ def, exitInto, last }: Props) {
  const scan = useScan()
  const stars = placeAtlas(scan.rows)
  const lit = recap(scan.rows, {
    loudest: pickLoudest(scan.rows)?.symbol ?? null,
    steadiest: steadiestRows(scan.rows, 1)[0]?.symbol ?? null,
    shortlistFirst: shortlist(scan.rows, 1)[0]?.symbol ?? null,
    kennel: KENNEL,
  })
  const lists = skippedLists(scan.meta)
  const skipped = REASONS.reduce((n, r) => n + lists[r].length, 0)
  const labels = useRef<HTMLDivElement>(null)
  const caption = useRef<HTMLDivElement>(null)

  useScrollFrame((s) => {
    applyLook(labels.current, { opacity: s.scene.atlasLabels, y: 0, blur: 0 })
    applyLook(caption.current, { opacity: s.scene.atlasLabels, y: 0, blur: 0 })
  })

  return (
    <>
      <Chapter def={def} exitInto={exitInto} last={last} />
      <div ref={labels} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2]" style={{ visibility: "hidden" }}>
        {lit.map((r) => {
          const star = stars.find((k) => k.symbol === r.symbol)
          if (!star) return null
          return (
            <Fragment key={r.symbol}>
              {/* A thin ring marks a charted coin. */}
              <ProjectedLabel point={() => atlasToWorld(star.x, star.y)} offset="translate(-50%, -50%)">
                <span className="block size-5 rounded-full border border-starlight-faint" />
              </ProjectedLabel>
              <ProjectedLabel
                point={() => atlasToWorld(star.x, star.y)}
                // Labels run toward the middle of the sky, so they never leave the screen.
                offset={star.x > 0 ? "translate(calc(-100% - 16px), -50%)" : "translate(16px, -50%)"}
                className={cn("grid gap-0.5 whitespace-nowrap", star.x > 0 ? "justify-items-end" : "justify-items-start")}
              >
                <span>
                  <span className="bayer mr-1.5">{r.letters.join(" ")}</span>
                  <span className="label text-starlight">{r.symbol}</span>
                </span>
                <span className="label text-starlight-dim">{r.role}</span>
              </ProjectedLabel>
            </Fragment>
          )
        })}
      </div>
      {/* The field's caption: how many coins, what η walked past, where the figures come from. */}
      <div
        ref={caption}
        className="label pointer-events-none fixed inset-x-0 bottom-[12svh] z-[2] flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1.5 px-4 text-starlight-dim"
        style={{ visibility: "hidden" }}
      >
        <span>
          <span className="bayer mr-1">θ</span> {stars.length} coins charted
        </span>
        <span>
          <span className="bayer mr-1">η</span> {skipped} skipped this poll
        </span>
        <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />
      </div>
    </>
  )
}
