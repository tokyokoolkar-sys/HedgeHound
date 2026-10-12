/** Port of the funding-spread playbook Monte Carlo. A what-if, not a forecast. */

export type MonteIn = {
  cap: number
  lev: number
  mu: number
  vol: number
  thr: number
  cost: number
  fix: number
  liq: number
}

export type MonteOut = {
  pLoss: number
  p5: number
  p5x: number
  p10: number
  p50: number
  p90: number
  inPos: number
  hist: { label: string; n: number; loss: boolean }[]
  fan: { week: string; lo: number; mid: number; hi: number }[]
}

function randn() {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function quantile(sorted: number[], p: number) {
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length)))
  return sorted[i] ?? 0
}

export function runMonte(v: MonteIn, paths = 4000): MonteOut {
  const days = 365
  const fin: number[] = []
  const cp: number[][] = []
  let inPosDays = 0
  const notional = (v.cap * v.lev) / 2
  const mu = v.mu / 100
  const sg = v.vol / 100
  const th = v.thr / 100
  const k = 0.12

  for (let i = 0; i < paths; i++) {
    let eq = v.cap
    let a = mu * 0.2
    let pos = false
    let daysIn = 0
    const row: number[] = []
    for (let d = 0; d < days; d++) {
      a = a + k * (mu - a) + sg * 0.5 * randn()
      if (!pos && a > th) {
        pos = true
        eq -= (eq / v.cap) * notional * (v.cost / 100) * 0.5
      } else if (pos && a < th / 2) {
        pos = false
        eq -= (eq / v.cap) * notional * (v.cost / 100) * 0.5
      }
      if (pos) {
        daysIn++
        eq += (eq / v.cap) * notional * (a / 365)
        if (Math.random() < (v.liq / 100) * (v.lev / 2)) eq -= eq * 0.25
      }
      if (eq < 0) eq = 0
      if ((d + 1) % 7 === 0) row.push(eq)
    }
    eq -= v.fix
    if (eq < 0) eq = 0
    if (row.length) row[row.length - 1] = eq
    fin.push(eq)
    cp.push(row)
    inPosDays += daysIn
  }

  const sorted = [...fin].sort((a, b) => a - b)
  const pLoss = sorted.filter((x) => x < v.cap).length / paths
  const p5 = sorted.filter((x) => x >= v.cap * 1.05).length / paths
  const p5x = sorted.filter((x) => x >= v.cap * 5).length / paths
  const lo = quantile(sorted, 0.01)
  const hi = Math.max(quantile(sorted, 0.99), v.cap * 1.01)
  const buckets = 18
  const bw = (hi - lo) / buckets || 1
  const hist = Array.from({ length: buckets }, (_, i) => {
    const x0 = lo + i * bw
    const x1 = x0 + bw
    const n = sorted.filter((x) => (i === buckets - 1 ? x >= x0 : x >= x0 && x < x1)).length
    const mid = (x0 + x1) / 2
    const label = `$${mid.toFixed(0)}`
    return { label, n, loss: mid < v.cap }
  })

  const weeks = cp[0]?.length ?? 0
  const fan = Array.from({ length: weeks }, (_, t) => {
    const col = cp.map((r) => r[t] ?? 0).sort((a, b) => a - b)
    return {
      week: `${t + 1}`,
      lo: quantile(col, 0.1),
      mid: quantile(col, 0.5),
      hi: quantile(col, 0.9),
    }
  })

  return {
    pLoss,
    p5,
    p5x,
    p10: quantile(sorted, 0.1),
    p50: quantile(sorted, 0.5),
    p90: quantile(sorted, 0.9),
    inPos: inPosDays / paths / days,
    hist,
    fan,
  }
}
