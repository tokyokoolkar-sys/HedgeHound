// Direction spike D1 "Almagest": DOM, scroll engine and per-frame text choreography (throwaway).
// Text is server-rendered; the canvas and the scroll engine load on the client only.
import { ClientOnly, useNavigate, useSearch } from "@tanstack/react-router"
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import { LogosCarousel } from "@/components/logos-carousel"
import { ShimmerText } from "@/components/shimmer-text"
import { SourceTag } from "@/components/edition/source-tag"
import { useScan } from "@/lib/scan/use-scan"
import { applyCrawl } from "./pixel-mask"
import { TYPE_PAIRS, band, clamp01, smooth, useSky, type GrainMode, type TypePair } from "./state"
import type { RadarCoin, Reading } from "./sky"
import "./almagest.css"

const Sky = lazy(() => import("./sky"))

const GREEK = ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ"]

/** Split text into word spans for the blur reveal. */
function Words({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ")
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="a-w" aria-hidden="true" style={{ "--i": i } as React.CSSProperties}>
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  )
}

type Reveal = { el: HTMLElement; words: HTMLElement[]; glint: boolean[] }

function collect(root: HTMLElement | null): Reveal | null {
  if (!root) return null
  const words = Array.from(root.querySelectorAll<HTMLElement>(".a-w"))
  return { el: root, words, glint: words.map((w) => !!w.closest("[data-shimmer]")) }
}

/**
 * Word-staggered blur reveal at progress p (0 hidden → 1 resolved), driven by the scroll.
 * Titles marked data-shimmer also catch a cold glint as each word lands: a light that travels
 * across the title with the scroll and stops when you stop.
 */
function revealWords(r: Reveal, p: number, reduced: boolean) {
  const n = r.words.length
  const step = Math.min(0.08, 0.6 / Math.max(1, n))
  r.words.forEach((w, i) => {
    const raw = clamp01((p * (1 + n * step) - i * step) / 1)
    const t = reduced ? (p > 0.5 ? 1 : 0) : smooth(raw)
    w.style.opacity = String(t)
    w.style.filter = t >= 0.999 ? "none" : `blur(${((1 - t) * 14).toFixed(2)}px)`
    w.style.transform = t >= 0.999 ? "none" : `translateY(${((1 - t) * 0.32).toFixed(3)}em)`
    if (r.glint[i] && !reduced) {
      // Glint peaks as the word finishes resolving (raw 0.55→1), then settles to plain starlight.
      const g = Math.max(0, Math.sin(Math.PI * clamp01((raw - 0.4) / 0.6)))
      w.style.color = g > 0.01 ? `color-mix(in srgb, #ffffff ${Math.round(g * 100)}%, var(--a-star))` : ""
      w.style.textShadow = g > 0.01 ? `0 0 ${(g * 26).toFixed(1)}px rgb(127 220 255 / ${(g * 0.6).toFixed(2)}), 0 0 ${(g * 3).toFixed(1)}px rgb(255 255 255 / ${(g * 0.8).toFixed(2)})` : ""
    }
  })
}

function fade(el: HTMLElement | null, o: number, blur = 0, y = 0) {
  if (!el) return
  el.style.opacity = String(o)
  el.style.visibility = o <= 0.001 ? "hidden" : "visible"
  el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none"
  el.style.transform = y !== 0 ? `translateY(${y.toFixed(2)}px)` : "none"
}

const CARDS = [
  {
    t: "Normalize",
    b: "Hourly equals the printed rate divided by the interval. Lighter’s public rate is eight-hour scale, so the hour is that rate divided by eight.",
  },
  { t: "Cancel", b: "Long the cheap hour, short the rich one, about the same notional. A spike hits both legs. What should remain is the spread." },
  {
    t: "Doubt",
    b: "Net APR subtracts the round trip, amortized over the hold you actually expect. A fat snapshot that dies in an hour never paid the ticket.",
  },
]

export function AlmagestPage() {
  const scan = useScan()
  const search = useSearch({ strict: false }) as { type?: string; grain?: string }
  const navigate = useNavigate()
  const type: TypePair = search.type && search.type in TYPE_PAIRS ? (search.type as TypePair) : "observatory"
  const grain: GrainMode = search.grain === "pixel" || search.grain === "mixed" ? search.grain : "dither"
  const setType = (t: TypePair) => void navigate({ to: ".", search: (p: object) => ({ ...p, type: t }), replace: true })
  const setGrain = (g: GrainMode) => void navigate({ to: ".", search: (p: object) => ({ ...p, grain: g }), replace: true })
  const [labelHost, setLabelHost] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(true)
  useEffect(() => setOpen(!window.matchMedia("(max-width: 767px)").matches), [])

  const symbols = useMemo(() => {
    const list = scan.rows.map((r) => r.symbol).slice(0, 30)
    return list.slice(0, list.length - (list.length % 5))
  }, [scan.rows])
  const coins = useMemo<RadarCoin[]>(
    () => scan.rows.map((r) => ({ symbol: r.symbol, net: r.net_apr, status: r.status })),
    [scan.rows],
  )
  const reading = useMemo<Reading | null>(() => {
    const ok = scan.rows.filter((r) => r.status === "ok").sort((a, b) => b.net_apr - a.net_apr)[0]
    const top = ok ?? [...scan.rows].sort((a, b) => b.net_apr - a.net_apr)[0]
    if (!top) return null
    return { symbol: top.symbol, net: top.net_apr, ok: top.status === "ok", live: scan.live, ts: scan.ts ?? undefined, stale: scan.stale }
  }, [scan.rows, scan.live, scan.ts, scan.stale])

  // Spacers
  const secHero = useRef<HTMLElement>(null)
  const secAlpha = useRef<HTMLElement>(null)
  const secCrawl = useRef<HTMLElement>(null)
  const secBeta = useRef<HTMLElement>(null)
  // Stage panels
  const heroRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)
  const alphaRef = useRef<HTMLDivElement>(null)
  const betaRef = useRef<HTMLDivElement>(null)
  const betaTitleRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const heroTitleRef = useRef<HTMLDivElement>(null)
  const alphaTitleRef = useRef<HTMLDivElement>(null)
  const betaHeadRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const coordRef = useRef<HTMLSpanElement>(null)
  const indexRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<{ scrollTo: (t: number, o?: { immediate?: boolean }) => void } | null>(null)

  useEffect(() => {
    useSky.getState().set({ grain })
  }, [grain])

  // Scroll engine + per-frame choreography.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const mobile = window.matchMedia("(max-width: 767px)").matches
    useSky.getState().set({ reduced, mobile })
    let disposed = false
    let cleanup = () => {}

    void (async () => {
      const [{ gsap }, { default: Lenis }] = await Promise.all([import("gsap"), import("lenis")])
      if (disposed) return

      const lenis = reduced ? null : new Lenis({ autoRaf: false, lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.9 })
      lenisRef.current = lenis
      const sections = [secHero, secAlpha, secCrawl, secBeta]
      let offsets: Array<[number, number]> = []
      const measure = () => {
        offsets = sections.map((s) => {
          const el = s.current!
          return [el.offsetTop, el.offsetHeight]
        })
      }
      measure()
      const ro = new ResizeObserver(measure)
      ro.observe(document.body)

      const hero = collect(heroRef.current)
      const alpha = collect(alphaRef.current)
      const betaTitle = collect(betaTitleRef.current)
      const cards = Array.from(cardsRef.current?.children ?? []) as HTMLElement[]

      let intro = reduced ? 1 : 0
      if (!reduced) gsap.to({ v: 0 }, { v: 1, duration: 2.4, delay: 0.5, ease: "power2.out", onUpdate() { intro = this.targets()[0].v } })

      const ptr: [number, number] = [0, 0]
      const onMove = (e: PointerEvent) => {
        ptr[0] = (e.clientX / window.innerWidth) * 2 - 1
        ptr[1] = -((e.clientY / window.innerHeight) * 2 - 1)
      }
      window.addEventListener("pointermove", onMove, { passive: true })

      const tick = (time: number) => {
        lenis?.raf(time * 1000)
        const y = lenis ? lenis.scroll : window.scrollY
        const [h, a, c, b] = offsets.map(([top, height]) => clamp01((y - top) / Math.max(1, height)))
        const st = useSky.getState()
        const k = reduced ? 1 : 0.06
        st.set({
          hero: h,
          alpha: a,
          crawl: c,
          beta: b,
          pointer: [st.pointer[0] + (ptr[0] - st.pointer[0]) * k, st.pointer[1] + (ptr[1] - st.pointer[1]) * k],
        })

        // Hero: resolves on load, dissolves into depth as the hound recedes.
        if (hero) {
          revealWords(hero, intro * (1 - band(h, 0.12, 0.42)), reduced)
          const ht = intro * (1 - band(h, 0.12, 0.42))
          fade(heroTitleRef.current, ht, (1 - ht) * 14, (1 - ht) * 18)
          fade(heroRef.current, 1 - band(h, 0.3, 0.5), 0, -band(h, 0, 0.5) * 60)
        }
        fade(cueRef.current, intro * (1 - band(h, 0.02, 0.12)))

        // α panel: words resolve after the constellation forms; the crawl eats it from below.
        // α card: no effect, it simply travels with the scroll: up from below the screen, rests, then
        // carries on up and out while the crawl eats the sky behind it.
        if (alpha && alphaRef.current) {
          const vh = window.innerHeight
          const enter = reduced ? (a > 0.4 ? 1 : 0) : smooth(band(a, 0.34, 0.5))
          const exit = reduced ? (c > 0.2 ? 1 : 0) : smooth(band(c, 0.0, 0.42))
          const yPx = (1 - enter) * vh * 0.95 - exit * vh * 1.05
          const el = alphaRef.current
          el.style.visibility = enter <= 0.001 || exit >= 0.999 ? "hidden" : "visible"
          el.style.transform = `translateY(${yPx.toFixed(1)}px)`
          revealWords(alpha, band(a, 0.44, 0.56), reduced)
          const tt = band(a, 0.42, 0.52)
          fade(alphaTitleRef.current, reduced ? 1 : tt, (1 - tt) * 10, 0)
        }

        // Symbols the hound is watching, while the screen is all grain.
        const co = reduced ? 0 : band(c, 0.26, 0.38) * (1 - band(c, 0.62, 0.74))
        fade(carouselRef.current, co, (1 - co) * 8, (1 - co) * 16)

        // β panel: the second crawl front builds the glass, then the words and cards resolve.
        if (betaRef.current) {
          const shown = c >= 0.5 && b < 1
          const out = band(b, 0.86, 1)
          fade(betaRef.current, shown ? 1 - out : 0, out * 10, -out * 40)
          applyCrawl(betaRef.current, !reduced && c >= 0.5 && c < 1 ? -0.3 + 1.6 * ((c - 0.5) * 2) : null, "in")
          const bp = band(c, 0.8, 1) * 0.5 + band(b, 0, 0.16) * 0.5
          if (betaTitle) revealWords(betaTitle, bp, reduced)
          fade(betaHeadRef.current, reduced ? 1 : bp, (1 - bp) * 12, (1 - bp) * 14)
          cards.forEach((card, i) => {
            const t = reduced ? (b > 0.1 ? 1 : 0) : smooth(band(b, 0.16 + i * 0.07, 0.34 + i * 0.07))
            fade(card, t, (1 - t) * 12, (1 - t) * 26)
          })
        }

        fade(endRef.current, smooth(band(b, 0.95, 1)) * (y > 0 ? 1 : 0), 0, 0)

        // HUD: the coordinate drifts with the pointer around Sirius (±2°).
        if (coordRef.current) {
          const raS = 6 * 3600 + 45 * 60 + 9 + st.pointer[0] * -480
          const dec = -16 - 43 / 60 + st.pointer[1] * 2
          const rh = Math.floor(raS / 3600), rm = Math.floor((raS % 3600) / 60), rs = Math.floor(raS % 60)
          const dd = Math.trunc(dec), dm = Math.round(Math.abs(dec - dd) * 60)
          coordRef.current.textContent = `RA ${String(rh).padStart(2, "0")}h ${String(rm).padStart(2, "0")}m ${String(rs).padStart(2, "0")}s · DEC −${Math.abs(dd)}° ${String(dm).padStart(2, "0")}′`
        }
        if (indexRef.current) {
          const active = c >= 0.5 ? (b > 0.95 ? 2 : 1) : a > 0.3 ? 0 : -1
          Array.from(indexRef.current.children).forEach((el, i) => el.toggleAttribute("data-on", i === active))
        }
      }
      gsap.ticker.add(tick)
      if (lenis) gsap.ticker.lagSmoothing(0)

      cleanup = () => {
        gsap.ticker.remove(tick)
        gsap.ticker.lagSmoothing(500, 33)
        window.removeEventListener("pointermove", onMove)
        ro.disconnect()
        if (lenis) {
          ;(lenis as unknown as { reset(): void }).reset()
          lenis.destroy()
        }
      }
    })()

    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  return (
    <div className="almagest" data-type={type}>
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>{labelHost && <Sky coins={coins} labels={labelHost} reading={reading} />}</Suspense>
      </ClientOnly>

      <div ref={setLabelHost} className="a-labels" />
      {/* Pixelate filter for the radar callout; block size is stepped by the scroll (pixel-mask.ts). */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="a-pixelate" x="0" y="0" width="100%" height="100%">
          <feFlood x="12" y="12" width="1" height="1" />
          <feComposite data-tile="" width="24" height="24" />
          <feTile result="tiles" />
          <feComposite in="SourceGraphic" in2="tiles" operator="in" />
          <feMorphology operator="dilate" radius="12" />
        </filter>
      </svg>

      {/* Scroll track: heights set the pace of each scene. */}
      <div className="a-track">
        <section ref={secHero} style={{ height: "170svh" }} aria-label="Overture" />
        <section ref={secAlpha} style={{ height: "300svh" }} aria-label="α Canis Major" />
        <section ref={secCrawl} style={{ height: "190svh" }} aria-label="Transition" />
        <section ref={secBeta} style={{ height: "330svh" }} aria-label="β Sniff" />
        <section style={{ height: "110svh" }} aria-label="End" />
      </div>

      <div className="a-stage">
        {/* HUD */}
        <div className="a-mono" style={{ position: "absolute", left: 24, top: 22, color: "var(--a-dim)" }}>
          <span ref={coordRef}>RA 06h 45m 09s · DEC −16° 43′</span>
        </div>
        <div className="a-mono a-brand" style={{ position: "absolute", right: 24, top: 22, color: "var(--a-faint)", textAlign: "right" }}>
          HedgeHound <span style={{ color: "var(--a-cyan)" }}>✶</span> Canis Edition
        </div>
        <div
          ref={indexRef}
          className="a-index"
          style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", display: "grid", gap: 10 }}
        >
          {GREEK.map((g) => (
            <span key={g} className="a-greek a-index-item">
              {g}
            </span>
          ))}
        </div>

        {/* Overture */}
        <div ref={heroRef} style={{ position: "absolute", left: 0, right: 0, bottom: "16svh", textAlign: "center", padding: "0 16px" }}>
          <div ref={heroTitleRef} style={{ opacity: 0 }}>
            <ShimmerText className="a-shimmer-title" duration={2.4} delay={1.2}>
              <h1 className="a-display" style={{ fontSize: "clamp(3.2rem, 9vw, 8.5rem)", margin: 0 }}>
                HedgeHound
              </h1>
            </ShimmerText>
          </div>
          <p className="a-mono" style={{ marginTop: 18, color: "var(--a-dim)" }}>
            <Words text="A funding-spread observatory · paper only" />
          </p>
        </div>
        <div ref={cueRef} className="a-mono" style={{ position: "absolute", left: 0, right: 0, bottom: 28, textAlign: "center", color: "var(--a-faint)" }}>
          Scroll <span className="a-greek">↓ α</span>
        </div>

        {/* α · Canis Major */}
        <div
          ref={alphaRef}
          className="a-glass"
          style={{ position: "absolute", left: "max(16px, 7vw)", bottom: "9svh", width: "min(470px, calc(100vw - 32px))", padding: "26px 28px", visibility: "hidden" }}
        >
          <p className="a-mono" style={{ margin: 0, color: "var(--a-dim)" }}>
            <span className="a-greek" style={{ fontSize: 14 }}>α</span> · Canis Major
          </p>
          <div ref={alphaTitleRef} style={{ margin: "14px 0 14px" }}>
            <ShimmerText className="a-shimmer-title" duration={2.4} delay={0.6}>
              <h2 className="a-display" style={{ fontSize: "clamp(2.2rem, 3.6vw, 3.4rem)", margin: 0 }}>
                The hound in the sky
              </h2>
            </ShimmerText>
          </div>
          <p className="a-body" style={{ margin: 0 }}>
            <Words text="Every coin is a star. Brightness is the spread it carries; a steady light is a spread that stays." />
          </p>
          <p className="a-mono" style={{ margin: "18px 0 0", color: "var(--a-faint)", fontSize: 9.5 }}>
            Positions J2000 · Bayer letters, after Ptolemy’s Almagest
          </p>
        </div>

        {/* β · Sniff */}
        <div
          ref={betaRef}
          className="a-beta"
          style={{ visibility: "hidden" }}
        >
          <div className="a-glass" style={{ padding: "26px 28px" }}>
            <div ref={betaTitleRef}>
              <p className="a-mono" style={{ margin: 0, color: "var(--a-dim)" }}>
                <span className="a-greek" style={{ fontSize: 14 }}>β</span> · Sniff
              </p>
              <div ref={betaHeadRef} style={{ margin: "12px 0 10px" }}>
                <ShimmerText className="a-shimmer-title" duration={2.2} delay={0.6}>
                  <h2 className="a-display" style={{ fontSize: "clamp(2.6rem, 5vw, 4.6rem)", margin: 0 }}>
                    Sniff
                  </h2>
                </ShimmerText>
              </div>
              <p className="a-body" style={{ margin: 0, fontStyle: "italic", fontSize: "clamp(1.2rem, 1.4vw, 1.45rem)", color: "var(--a-star)" }}>
                <Words text="Every five minutes, the hound lifts its nose." />
              </p>
            </div>
            <div ref={cardsRef} style={{ display: "grid", gap: 14, marginTop: 22 }}>
              {CARDS.map((c, i) => (
                <div key={c.t} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 10, opacity: 0 }}>
                  <span className="a-greek" style={{ fontSize: 12, paddingTop: 3 }}>
                    {["i", "ii", "iii"][i]}
                  </span>
                  <div>
                    <p className="a-display" style={{ margin: 0, fontSize: "1.25rem" }}>
                      {c.t}
                    </p>
                    <p className="a-body" style={{ margin: "3px 0 0", fontSize: "0.94rem", lineHeight: 1.45 }}>
                      {c.b}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transition: the field, cycling in staggered groups. */}
        <div ref={carouselRef} className="a-carousel" style={{ opacity: 0, visibility: "hidden" }}>
          <p className="a-mono" style={{ margin: 0, color: "var(--a-faint)" }}>
            <span className="a-greek">α → β</span> · on the hound’s nose
          </p>
          {symbols.length > 0 && (
            <LogosCarousel count={5} stagger={0.12} interval={2200} duration={700}>
              {symbols.map((sym) => (
                <span key={sym} className="a-symbol">
                  {sym}
                </span>
              ))}
            </LogosCarousel>
          )}
          <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} />
        </div>

        {/* γ teaser */}
        <div ref={endRef} style={{ position: "absolute", left: 0, right: 0, top: "42svh", textAlign: "center", opacity: 0, visibility: "hidden" }}>
          <p className="a-mono" style={{ color: "var(--a-dim)" }}>
            <span className="a-greek" style={{ fontSize: 14 }}>γ</span> · next chapter
          </p>
          <p className="a-display" style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)", margin: "10px 0 0" }}>
            One coin. Two legs.
          </p>
          <p className="a-mono" style={{ marginTop: 18, color: "var(--a-faint)" }}>
            End of direction prototype D1
          </p>
        </div>
      </div>

      {/* Owner's switchboard */}
      <div className="a-controls a-glass" role="group" aria-label="Prototype options" data-open={open ? "" : undefined}>
        <button type="button" className="a-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Hide options" : "Options · type · grain"}
        </button>
        <div className="row">
          <b>Type</b>
          {(Object.keys(TYPE_PAIRS) as TypePair[]).map((k) => (
            <button key={k} type="button" aria-pressed={type === k} onClick={() => setType(k)} title={TYPE_PAIRS[k].label}>
              {TYPE_PAIRS[k].display}
            </button>
          ))}
        </div>
        <div className="row">
          <b>Grain</b>
          {(["pixel", "dither", "mixed"] as GrainMode[]).map((g) => (
            <button key={g} type="button" aria-pressed={grain === g} onClick={() => setGrain(g)}>
              {g}
            </button>
          ))}
          <button
            type="button"
            onClick={() => (lenisRef.current ? lenisRef.current.scrollTo(0, { immediate: true }) : window.scrollTo({ top: 0 }))}
            style={{ marginLeft: "auto" }}
          >
            ↑ top
          </button>
        </div>
      </div>
    </div>
  )
}
