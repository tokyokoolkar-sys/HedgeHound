// The radar's data, shared by the 3D radar and the labels projected onto it (context is bridged into the
// canvas, so both read the same TanStack Query cache and always agree).
import { useEffect, useMemo, useState } from "react"
import { pickLoudest } from "@/lib/scan/loudest"
import { useScan } from "@/lib/scan/use-scan"
import { instrumentLayout, type InstrumentLayout } from "@/lib/stage/layout"
import { placeCoins } from "@/lib/stage/radar"

export function useRadar() {
  const scan = useScan()
  const data = useMemo(() => {
    const loudest = pickLoudest(scan.rows)
    const placed = placeCoins(scan.rows, loudest?.symbol ?? null)
    const anchor = placed.find((k) => k.symbol === loudest?.symbol) ?? null
    return { loudest, placed, anchor }
  }, [scan.rows])
  return { scan, ...data }
}

/** The instrument layout for the current viewport, in step with the 3D objects (same pure function). */
export function useInstrumentLayout() {
  const [layout, setLayout] = useState<InstrumentLayout>(() => instrumentLayout(1440, 900))
  useEffect(() => {
    const on = () => setLayout(instrumentLayout(document.documentElement.clientWidth, window.innerHeight))
    on()
    window.addEventListener("resize", on)
    return () => window.removeEventListener("resize", on)
  }, [])
  return layout
}
