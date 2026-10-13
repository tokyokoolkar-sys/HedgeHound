import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

const LINKS = [
  { to: "/", label: "Story" },
  { to: "/universe", label: "Sky" },
  { to: "/den", label: "Den" },
] as const;

export function SiteNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/80 bg-bg/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex min-h-11 items-center gap-2">
          <img src="/favicon.svg" alt="" width={32} height={32} className="size-8" />
          <span className="font-sans text-base font-extrabold tracking-tight">HedgeHound</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Pages">
          {LINKS.map((l) => {
            const on = path === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-3 font-sans text-sm font-bold",
                  on ? "text-brand" : "text-v1-muted",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
