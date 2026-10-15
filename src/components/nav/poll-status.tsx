// The scanner's status in the nav (T30): "● LIVE · 12:04 · next poll 04:12" while the scanner answers,
// "scanner offline · start it" with the SAMPLE tag when it doesn't. Every state says where figures come from.
import { cn } from "@/lib/cn"
import { useScan } from "@/lib/scan/use-scan"
import { useMounted } from "@/lib/use-mounted"
import { SourceTag } from "../edition/source-tag"

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

/**
 * `wordsClassName` lets a tight nav drop the words visually and keep only the tag (words stay for screen readers).
 * `reserve` keeps the status's room from the first paint (a class with a min width), so the nav never shifts
 * when the client learns the scanner's state (P4 critique: the links jumped ~250 px on load).
 */
export function PollStatus({ className, wordsClassName, reserve }: { className?: string; wordsClassName?: string; reserve?: string }) {
  const scan = useScan()
  // The scanner's state is client-only (the server never asks it), so the content renders after mount.
  const mounted = useMounted()
  if (!mounted || scan.loading) return reserve ? <span aria-hidden="true" className={cn("inline-block", reserve)} /> : null
  return (
    <span className={cn("label inline-flex items-baseline justify-end gap-2.5 whitespace-nowrap text-starlight-dim", reserve, className)}>
      {scan.live ? (
        scan.nextPollIn != null && <span className={cn("tabular-nums", wordsClassName)}>next poll {clock(scan.nextPollIn)}</span>
      ) : (
        <span className={wordsClassName}>scanner offline</span>
      )}
      <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />
    </span>
  )
}
