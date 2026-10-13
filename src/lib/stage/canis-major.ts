// Canis Major from real J2000 coordinates. The Bayer letters are the Greek-astronomy layer (DESIGN.md).
export type CmaStar = { key: string; bayer: string; name?: string; ra: [number, number, number]; dec: [number, number]; mag: number }

export const CMA: CmaStar[] = [
  { key: "alpha", bayer: "α", name: "Sirius", ra: [6, 45, 9], dec: [-16, 43], mag: -1.46 },
  { key: "beta", bayer: "β", name: "Mirzam", ra: [6, 22, 42], dec: [-17, 57], mag: 1.98 },
  { key: "gamma", bayer: "γ", name: "Muliphein", ra: [7, 3, 45], dec: [-15, 38], mag: 4.12 },
  { key: "delta", bayer: "δ", name: "Wezen", ra: [7, 8, 23], dec: [-26, 24], mag: 1.83 },
  { key: "epsilon", bayer: "ε", name: "Adhara", ra: [6, 58, 38], dec: [-28, 58], mag: 1.5 },
  { key: "zeta", bayer: "ζ", name: "Furud", ra: [6, 20, 19], dec: [-30, 4], mag: 3.02 },
  { key: "eta", bayer: "η", name: "Aludra", ra: [7, 24, 6], dec: [-29, 18], mag: 2.45 },
  { key: "theta", bayer: "θ", ra: [6, 54, 11], dec: [-12, 2], mag: 4.07 },
  { key: "iota", bayer: "ι", ra: [6, 56, 8], dec: [-17, 3], mag: 4.37 },
  { key: "omicron1", bayer: "ο¹", ra: [6, 54, 8], dec: [-24, 11], mag: 3.87 },
  { key: "omicron2", bayer: "ο²", ra: [7, 3, 1], dec: [-23, 50], mag: 3.02 },
  { key: "sigma", bayer: "σ", ra: [7, 1, 43], dec: [-27, 56], mag: 3.47 },
  { key: "kappa", bayer: "κ", ra: [6, 49, 50], dec: [-32, 30], mag: 3.96 },
]

export const CMA_LINES: Array<[string, string]> = [
  ["theta", "iota"],
  ["gamma", "iota"],
  ["iota", "alpha"],
  ["alpha", "beta"],
  ["alpha", "omicron1"],
  ["omicron1", "omicron2"],
  ["omicron2", "delta"],
  ["delta", "eta"],
  ["delta", "sigma"],
  ["sigma", "epsilon"],
  ["epsilon", "zeta"],
  ["epsilon", "kappa"],
]

const RA0 = 6.86 * 15
const DEC0 = -21.6
const SCALE = 0.29

/** Gnomonic-ish flat projection, east to the left as on a sky chart. */
export function project(s: CmaStar): [number, number] {
  const ra = (s.ra[0] + s.ra[1] / 60 + s.ra[2] / 3600) * 15
  const dec = s.dec[0] + Math.sign(s.dec[0]) * (s.dec[1] / 60)
  const x = -(ra - RA0) * Math.cos((DEC0 * Math.PI) / 180) * SCALE
  const y = (dec - DEC0) * SCALE
  return [x, y]
}

/** Point size in px for an apparent magnitude. */
export const magToPx = (mag: number) => 5 + Math.max(0, 4.6 - mag) * 6.5
