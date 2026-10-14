// Sirius' real position (J2000), the Edition's home coordinate in the HUD (DESIGN.md).
const SIRIUS_RA_S = 6 * 3600 + 45 * 60 + 9
const SIRIUS_DEC = -(16 + 43 / 60)

/** The HUD readout, drifting ±8 min RA / ±2° DEC with the pointer (-1..1). Uses a true minus and primes. */
export function formatCoordinate(px: number, py: number) {
  const ra = SIRIUS_RA_S - px * 480
  const dec = SIRIUS_DEC + py * 2
  const h = Math.floor(ra / 3600)
  const m = Math.floor((ra % 3600) / 60)
  const s = Math.floor(ra % 60)
  const dd = Math.trunc(dec)
  const dm = Math.round(Math.abs(dec - dd) * 60)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `RA ${pad(h)}h ${pad(m)}m ${pad(s)}s · DEC −${Math.abs(dd)}° ${pad(dm)}′`
}


/** Where Sirius stands alone in κ's ledger (world units, default camera), above the closing lines. */
export const SIRIUS_AT: [number, number, number] = [0, 1.9, 0]
