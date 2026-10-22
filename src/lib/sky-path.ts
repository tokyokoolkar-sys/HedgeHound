// A coin's address in the sky: the dynamic route /sky/[star]. Pure, so the proxy (old ?star= links), the route
// and every link share one rule for what a symbol may look like and how it is spelled (upper case).

const SYMBOL = /^[A-Za-z0-9._-]{1,24}$/

/** A symbol from the address or a query, upper-cased; anything else is no star. */
export function parseStar(raw: unknown): string | undefined {
  return typeof raw === "string" && SYMBOL.test(raw) ? raw.toUpperCase() : undefined
}

/** `BTC` → `/sky/BTC`; no star → `/sky`. */
export function skyPath(star?: string): string {
  return star ? `/sky/${star}` : "/sky"
}

/** The star in a pathname: `/sky/BTC` → `BTC`. Other paths, or a bad symbol, → undefined. */
export function starFromPath(path: string): string | undefined {
  const m = /^\/sky\/([^/]+)\/?$/.exec(path)
  return m ? parseStar(m[1]) : undefined
}

/** The document title for a star (the root's "· HedgeHound" template spelled out, as focus changes set it by hand). */
export function skyTitle(star?: string): string {
  return `${star ? `${star} · ` : ""}The Sky · HedgeHound`
}
