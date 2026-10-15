import { useQuery } from "@tanstack/react-query"
import { useMounted } from "../use-mounted.ts"
import { fetchHistory, type HistoryPoint } from "./history.ts"
import { SCANNER_POLL_SECONDS } from "./types.ts"

/**
 * One coin's recent history (T41), refreshed once per scanner poll. Client-only and LIVE-only: pass `live` from
 * `useScan()`, so a SAMPLE page never asks. Null while unknown or when the scanner can't answer; callers hide the
 * piece that needs it rather than draw anything made up.
 */
export function useHistory(sym: string | null | undefined, live: boolean, hours = 24): HistoryPoint[] | null {
  const mounted = useMounted()
  const q = useQuery({
    queryKey: ["history", sym, hours],
    queryFn: ({ signal }) => fetchHistory(sym as string, hours, signal),
    enabled: mounted && live && !!sym,
    staleTime: SCANNER_POLL_SECONDS * 1000,
    refetchInterval: SCANNER_POLL_SECONDS * 1000,
  })
  return mounted && live ? (q.data ?? null) : null
}
