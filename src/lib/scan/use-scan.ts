import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { fetchScan } from "./api.ts"
import { secondsToNextPoll } from "./normalize.ts"
import { sampleScan } from "./sample.ts"
import type { ScanMeta, ScanParams, ScanResult, ScanRow } from "./types.ts"
import { DEFAULT_SCAN_PARAMS } from "./types.ts"

export const SCAN_REFETCH_MS = 30_000
export const SCAN_STALE_MS = 25_000

export type UseScan = {
  rows: ScanRow[]
  meta: ScanMeta
  /** true: LIVE from the scanner. false: SAMPLE (tag it so). */
  live: boolean
  /** Epoch ms of the scanner's last poll; null while SAMPLE. */
  ts: number | null
  /** Whole seconds to the next 300 s scanner poll; null until mounted or while SAMPLE. */
  nextPollIn: number | null
  /** The scanner's error text, or why the sample is showing. */
  err: string | null
  /** true until the first answer (live or fallback) has arrived. */
  loading: boolean
}

let sampleCache: ScanResult | undefined
const sample = () => (sampleCache ??= sampleScan())

/**
 * The live scan, polled every 30 s. Until the first answer arrives (and during SSR) it
 * returns the labelled sample, so server and client first render agree and no figure is
 * ever shown untagged. Safe with the scanner off: the fetch falls back to the same sample.
 */
export function useScan(params: Partial<ScanParams> = {}): UseScan {
  const key: ScanParams = { ...DEFAULT_SCAN_PARAMS, ...params }
  const query = useQuery({
    queryKey: ["scan", { min: key.min, hold: key.hold, lev: key.lev }],
    queryFn: ({ signal }) => fetchScan(key, signal),
    refetchInterval: SCAN_REFETCH_MS,
    staleTime: SCAN_STALE_MS,
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
    err: scan.err,
    loading: query.data === undefined,
  }
}
