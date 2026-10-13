// Site nav (T13, all pages per owner decision 2b): the wordmark and mono links straight on the sky,
// with no bar and no glass. "Open scanner" (a starlight hairline) arrives with /scanner in T30/T31.
import { Link, useRouterState } from "@tanstack/react-router"
import { cn } from "@/lib/cn"

const LINKS = [
  { to: "/", label: "Edition" },
  { to: "/universe", label: "Sky" },
  { to: "/den", label: "Den" },
] as const

export function SiteNav() {
  const path = useRouterState({ select: (s) => s.location.pathname })
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30">
      <div className="flex h-16 items-center justify-between gap-4 px-[max(16px,7vw)]">
        <Link to="/" className="pointer-events-auto flex min-h-11 items-center">
          <span className="text-subtitle font-light-display text-starlight">HedgeHound</span>
        </Link>
        <nav className="pointer-events-auto flex items-center gap-5 sm:gap-7" aria-label="Pages">
          {LINKS.map((l) => {
            const on = path === l.to
            return (
              <Link
                key={l.to}
                to={l.to}
                aria-current={on ? "page" : undefined}
                className={cn("label inline-flex min-h-11 items-center", on ? "text-starlight" : "text-starlight-dim hover:text-starlight")}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
