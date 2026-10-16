"use client"
// The persistent shell (was __root.tsx's body): mounted once by the root layout and never remounted by
// navigation, so the one sky canvas (SkyHost) and the scroll engine live across every page (hard rule 2).
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useState, type ReactNode } from "react"
import { SiteNav } from "@/components/nav/site-nav"
import { SkyHost } from "@/components/stage/sky-host"
import { ScrollEngine } from "@/lib/motion/scroll-engine"
import { scrollToTarget } from "@/lib/motion/scroll-bus"
import { measureSections } from "@/lib/motion/scroll-progress"

export function Providers({ children }: { children: ReactNode }) {
  // One client per document: created in state so SSR requests never share cache.
  const [queryClient] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      {/* T11: smooth scroll + section progress for every page (effects only; nothing renders). */}
      <ScrollEngine />
      <RouteScroll />
      {/* T12: the one sky canvas; dormant until a page calls useRequestSky(). */}
      <AfterHydration>
        <SkyHost />
      </AfterHydration>
      <a
        href="#content"
        className="label fixed top-2 left-2 z-[60] -translate-y-16 bg-void px-3 py-2 text-starlight focus-visible:translate-y-0"
      >
        Skip to content
      </a>
      <Suspense>
        <SiteNav />
      </Suspense>
      <div id="content" tabIndex={-1} className="outline-none">
        {children}
      </div>
    </QueryClientProvider>
  )
}

/**
 * Mounts its children once the browser is idle after hydration (at most ~1.2 s later). App Router hydrates
 * earlier than the old Start build did, so the sky's WebGL boot landed inside the hydration task (M0 Lighthouse:
 * TBT 2× the old build). Waiting for idle keeps the two apart; the sky still fades in from the void as before.
 */
function AfterHydration({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(() => setReady(true), { timeout: 1200 })
      return () => cancelIdleCallback(id)
    }
    const id = window.setTimeout(() => setReady(true), 300)
    return () => window.clearTimeout(id)
  }, [])
  return ready ? children : null
}

/**
 * Client navigation: Next scrolls the window, but Lenis keeps its own target and the old page's sections.
 * On a new path: re-measure, then land at the top (or at the #hash) without a smooth glide.
 */
function RouteScroll() {
  const path = usePathname()
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      measureSections()
      const hash = decodeURIComponent(window.location.hash.slice(1))
      const el = hash ? document.getElementById(hash) : null
      scrollToTarget(el ?? 0, { immediate: true })
    })
    return () => cancelAnimationFrame(id)
  }, [path])
  return null
}
