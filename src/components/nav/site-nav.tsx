// Site nav (T30, every page): the wordmark and mono links straight on the sky, no bar and no glass.
// Desktop: pages, the scanner's poll status and ⌘K coin search. Phones: the wordmark and a "menu" that
// opens as text on the void: the pages, the status, search, and on the Edition the chapters α–κ to jump
// to (the phone's position cue). "Scanner" joined the links with /scanner (T31).
import { Link, useRouterState } from "@tanstack/react-router"
import { Dialog } from "radix-ui"
import { useState } from "react"
import { cn } from "@/lib/cn"
import { chapterOf } from "@/content/edition"
import { EDITION } from "@/lib/stage/rhythm"
import { useStage } from "@/lib/stage/store"
import { jumpToChapter } from "../edition/jump"
import { CoinSearch, SKY_ROUTE } from "./coin-search"
import { PollStatus } from "./poll-status"

/** Pages in the nav. Each P4 ticket adds its own when the page exists. */
const LINKS = [
  { to: "/", label: "Edition" },
  { to: "/scanner", label: "Scanner" },
  { to: SKY_ROUTE, label: "Sky" },
  { to: "/den", label: "Den" },
  { to: "/playbook", label: "Playbook" },
] as const

export function SiteNav() {
  const path = useRouterState({ select: (s) => s.location.pathname })
  const [search, setSearch] = useState(false)
  const [menu, setMenu] = useState(false)

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30">
      <div className="flex h-16 items-center justify-between gap-4 px-[max(16px,7vw)]">
        <Link to="/" className="pointer-events-auto flex min-h-11 items-center">
          <span className="text-subtitle font-light-display text-starlight">HedgeHound</span>
        </Link>

        {/* Desktop */}
        <div className="pointer-events-auto hidden items-center gap-5 md:flex lg:gap-7">
          <nav className="flex items-center gap-5 lg:gap-7" aria-label="Pages">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} label={l.label} on={path === l.to} />
            ))}
          </nav>
          <PollStatus wordsClassName="max-lg:sr-only" />
          <button
            type="button"
            onClick={() => setSearch(true)}
            className="label inline-flex min-h-11 items-center gap-2 text-starlight-dim hover:text-starlight focus-visible:text-scan"
            aria-keyshortcuts="Meta+K Control+K"
          >
            <span className="max-lg:sr-only">search</span> <span aria-hidden="true">⌘K</span>
          </button>
        </div>

        {/* Phones */}
        <button
          type="button"
          onClick={() => setMenu(true)}
          className="label pointer-events-auto inline-flex min-h-11 items-center text-starlight md:hidden"
          aria-haspopup="dialog"
        >
          menu
        </button>
      </div>

      <PhoneMenu open={menu} onOpenChange={setMenu} path={path} onSearch={() => setSearch(true)} />
      <CoinSearch open={search} onOpenChange={setSearch} />
    </header>
  )
}

function NavLink({ to, label, on, big }: { to: string; label: string; on: boolean; big?: boolean }) {
  return (
    <Link
      to={to}
      aria-current={on ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center",
        big ? "font-light-display text-title" : "label",
        on ? "text-starlight" : "text-starlight-dim hover:text-starlight",
      )}
    >
      {label}
    </Link>
  )
}

function PhoneMenu({ open, onOpenChange, path, onSearch }: { open: boolean; onOpenChange: (o: boolean) => void; path: string; onSearch: () => void }) {
  const lettered = EDITION.filter((c) => c.letter)
  // Where the reader is, read once per render (the menu re-renders on open): that chapter's label is lit.
  const here = chapterOf(useStage.getState().active)
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content aria-describedby={undefined} className="pointer-events-auto fixed inset-0 z-50 overflow-y-auto bg-void px-[max(16px,7vw)] pb-10 outline-none">
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <div className="flex h-16 items-center justify-between">
            <span className="text-subtitle font-light-display text-starlight">HedgeHound</span>
            <Dialog.Close className="label inline-flex min-h-11 items-center text-starlight">close</Dialog.Close>
          </div>
          <nav aria-label="Pages" className="mt-8 grid justify-items-start gap-1" onClick={() => onOpenChange(false)}>
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} label={l.label} on={path === l.to} big />
            ))}
          </nav>
          <div className="mt-6 grid justify-items-start gap-3">
            <PollStatus />
            <button
              type="button"
              onClick={() => {
                onOpenChange(false)
                onSearch()
              }}
              className="label inline-flex min-h-11 items-center text-starlight"
            >
              ⌕ search a coin
            </button>
          </div>
          {path === "/" && (
            <nav aria-label="Chapters" className="mt-8 grid gap-0 border-t border-starlight-faint pt-4">
              <p className="label m-0 mb-2 text-starlight-dim">The Edition</p>
              {lettered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-current={c.id === here ? "true" : undefined}
                  onClick={() => {
                    onOpenChange(false)
                    jumpToChapter(c.id)
                  }}
                  className="grid min-h-11 grid-cols-[2rem_1fr] items-baseline text-left text-starlight-dim hover:text-starlight aria-[current]:text-starlight"
                >
                  <span className="bayer">{c.letter}</span>
                  <span className="label">{c.kicker ?? c.title}</span>
                </button>
              ))}
            </nav>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
