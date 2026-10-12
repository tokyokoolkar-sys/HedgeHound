import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { fetchScan } from "./api.ts"
import { secondsToNextPoll } from "./normalize.ts"
import { isStale, nextMisses, refetchIntervalMs, scanKey, staleTimeMs } from "./query.ts"
import { sampleScan } from "./sample.ts"
import type { ScanMeta, ScanParams, ScanResult, ScanRow } from "./types.ts"
import { DEFAULT_SCAN_PARAMS } from "./types.ts"

export { BACKOFF_STEPS_MS, SCAN_REFETCH_MS, SCAN_STALE_MS, STALE_AFTER_MS } from "./query.ts"

export type UseScan = {
  rows: ScanRow[]
  meta: ScanMeta
  /** true: LIVE from the scanner. false: SAMPLE (tag it so). */
  live: boolean
  /** Epoch ms of the scanner's last poll; null while SAMPLE. */
  ts: number | null
  /** Whole seconds to the next 300 s scanner poll; null until mounted or while SAMPLE. */
  nextPollIn: number | null
  /**
   * LIVE reading older than one scanner poll (300 s). Client clock only: always false on
   * the server, on the first client render and while SAMPLE. Pass it to `<SourceTag stale>`.
   */
  stale: boolean
  /** The scanner's error text, or why the sample is showing. */
  err: string | null
  /** true until the first answer (live or fallback) has arrived. */
  loading: boolean
}

let sampleCache: ScanResult | undefined
const sample = () => (sampleCache ??= sampleScan())

/**
 * The live scan, polled every 30 s while the scanner answers. While the fallback is
 * showing it backs off (30 s, 2 min, 5 min cap) and returns to 30 s on the first live
 * answer, so a scanner that is off does not fill the console with failed requests. Until the first answer arrives (and during SSR) it
 * returns the labelled sample, so server and client first render agree and no figure is
 * ever shown untagged. Safe with the scanner off: the fetch falls back to the same sample.
 */
export function useScan(params: Partial<ScanParams> = {}): UseScan {
  const key: ScanParams = { ...DEFAULT_SCAN_PARAMS, ...params }
  const queryKey = scanKey(key)
  const client = useQueryClient()
  const query = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const fresh = await fetchScan(key, signal)
      const prev = client.getQueryData<ScanResult>(queryKey)
      return { ...fresh, misses: nextMisses(prev, fresh) }
    },
    // Functions of the last answer: TanStack re-reads them after every fetch.
    refetchInterval: (q) => refetchIntervalMs(q.state.data),
    staleTime: (q) => staleTimeMs(q.state.data),
  })

  const scan = query.data ?? sample()
  const ts = scan.ts

  // Ticks only on the client, after mount, so the server render never carries a clock.
  const [now, setNow] = useState<number | null>(null)
  const ticking = ts !== null
  useEffect(() => {
    if (!ticking) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [ticking])

  return {
    rows: scan.rows,
    meta: scan.meta,
    live: scan.live,
    ts,
    nextPollIn: ts !== null && now !== null ? secondsToNextPoll(ts, now) : null,
    stale: scan.live && isStale(ts, now),
    err: scan.err,
    loading: query.data === undefined,
  }
}
