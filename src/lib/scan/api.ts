import { sampleScan } from "./sample.ts"
import { normalizeScan } from "./normalize.ts"
import { scanQueryString } from "./query.ts"
import type { ScanParams, ScanResult } from "./types.ts"
import { DEFAULT_SCAN_PARAMS } from "./types.ts"

/** Empty in dev: the Vite proxy forwards `/api` to the scanner on 127.0.0.1:8000. */
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? ""

const TIMEOUT_MS = 10_000

/**
 * Fetch the local scanner. Port of WhaleHunterAlt `web/src/lib/api.ts` `fetchScan`.
 *
 * Never throws. Scanner off, proxy error, bad JSON: all return the labelled static sample
 * (`live: false`, `ts: null`), so no page has an error state to render. The scanner's `ts`
 * is epoch seconds; the result carries milliseconds.
 */
export async function fetchScan(
  params: ScanParams = DEFAULT_SCAN_PARAMS,
  signal?: AbortSignal,
): Promise<ScanResult> {
  try {
    const qs = scanQueryString(params)
    const timeout = AbortSignal.timeout(TIMEOUT_MS)
    const res = await fetch(`${BASE}/api/scan?${qs}`, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const scan = normalizeScan(await res.json())
    if (!scan) throw new Error("unexpected response shape")
    return scan
  } catch {
    return sampleScan()
  }
}
