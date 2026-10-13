// Starting quality tier from what the device says about itself. T12 refines it from real frame rates.

export type Quality = "high" | "mid" | "low"

export type DeviceHints = {
  /** navigator.hardwareConcurrency (undefined when the browser won't say). */
  cores?: number
  /** navigator.deviceMemory in GB (Chromium only). */
  memory?: number
  /** Viewport width in CSS px. */
  width: number
  /** Coarse pointer (touch-first device). */
  coarse?: boolean
}

export function pickTier({ cores, memory, width, coarse }: DeviceHints): Quality {
  const weakCpu = cores !== undefined && cores <= 4
  const lowMem = memory !== undefined && memory <= 4
  if (weakCpu && lowMem) return "low"
  if (width < 768 || coarse || weakCpu || lowMem) return "mid"
  return "high"
}

/** Browser-only. Reads the hints from navigator and matchMedia. */
export function detectTier(): Quality {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return pickTier({
    cores: nav.hardwareConcurrency || undefined,
    memory: nav.deviceMemory,
    width: window.innerWidth,
    coarse: window.matchMedia("(pointer: coarse)").matches,
  })
}
