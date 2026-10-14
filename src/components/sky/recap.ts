// The recap's picks: each earlier chapter's key coin by that chapter's own rule (lib/stage/atlas.ts recap()).
import { KENNEL } from "@/content/edition"
import { pickLoudest } from "@/lib/scan/loudest"
import type { ScanRow } from "@/lib/scan/types"
import { recap } from "@/lib/stage/atlas"
import { steadiestRows } from "@/lib/stage/comet"
import { shortlist } from "@/lib/stage/field"

export function recapFor(rows: ScanRow[]) {
  return recap(rows, {
    loudest: pickLoudest(rows)?.symbol ?? null,
    steadiest: steadiestRows(rows, 1)[0]?.symbol ?? null,
    shortlistFirst: shortlist(rows, 1)[0]?.symbol ?? null,
    kennel: KENNEL,
  })
}
