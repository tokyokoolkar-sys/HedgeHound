// The atlas's recap (DESIGN.md "Atlas"): each earlier chapter's key coin, ringed and lettered, picked by those
// chapters' own rules so θ and /sky always agree. Shared by θ (chapters/08-sky.tsx) and /sky (T33).
import { Fragment } from "react"
import { cn } from "@/lib/cn"
import type { ScanRow } from "@/lib/scan/types"
import { atlasWorld, type AtlasStar } from "@/lib/stage/atlas"
import { ProjectedLabel } from "../edition/projected-label"
import { recapFor } from "./recap"

/** The rings and letters. Visibility follows the atlas (each label hides while its coin is not drawn). */
export function RecapLabels({ rows, stars, hide }: { rows: ScanRow[]; stars: AtlasStar[]; hide?: string | null }) {
  return (
    <>
      {recapFor(rows).map((r) => {
        const star = stars.find((k) => k.symbol === r.symbol)
        if (!star || r.symbol === hide) return null
        const point = () => atlasWorld.get(r.symbol) ?? null
        return (
          <Fragment key={r.symbol}>
            {/* A thin ring marks a charted coin. */}
            <ProjectedLabel point={point} offset="translate(-50%, -50%)">
              <span className="block size-5 rounded-full border border-starlight-faint" />
            </ProjectedLabel>
            <ProjectedLabel
              point={point}
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
    </>
  )
}
