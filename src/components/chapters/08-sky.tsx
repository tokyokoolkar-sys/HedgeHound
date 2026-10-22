// θ The Sky (PLAN §3 θ, TICKETS T25). Owner decisions: (a) the atlas now, "Enter the sky" with T33 (the
// same field at the same spots on the same canvas, so /sky continues it without a cut), (b) recap labels with
// each chapter's letter, (c) title and subtitle only.
// - copy: <Chapter> (title + subtitle, a quiet breath);
// - instrument: objects/atlas.tsx (every coin, filling the sky), channels in sky-scene.ts;
// - labels: each earlier chapter's key coin, picked by those chapters' own rules (lib/stage/atlas.ts), and a
//   caption that counts the field and η's skipped coins, with one SourceTag.
import { Link } from "@/lib/nav"
import { useRef } from "react"
import { useScan } from "@/lib/scan/use-scan"
import { placeAtlas } from "@/lib/stage/atlas"
import { REASONS, skippedLists } from "@/lib/stage/embers"
import type { ChapterDef } from "@/content/edition"
import { Chapter } from "../edition/chapter"
import { applyLook } from "../edition/look"
import { SourceTag } from "../edition/source-tag"
import { useScrollFrame } from "../edition/use-scroll-frame"
import { RecapLabels } from "../sky/recap-labels"

type Props = { def: ChapterDef; exitInto?: string; last?: boolean }

export function Sky({ def, exitInto, last }: Props) {
  const scan = useScan()
  const stars = placeAtlas(scan.rows)
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
        <RecapLabels rows={scan.rows} stars={stars} />
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
        <Link
          to="/sky"
          className="pointer-events-auto inline-flex min-h-11 items-center text-starlight underline decoration-starlight-faint decoration-1 underline-offset-[6px] hover:decoration-starlight focus-visible:text-scan"
        >
          Enter the sky →
        </Link>
      </div>
    </>
  )
}
