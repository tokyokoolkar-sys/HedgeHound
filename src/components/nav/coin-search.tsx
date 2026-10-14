// ⌘K coin search (T30): type a symbol, jump to it on the sky. Built on cmdk + the radix dialog directly
// (not the shadcn skin): a hairline frame on the void, mono rows, no glass, no blur. Every figure in the list
// is tagged (one SourceTag for the group). Opens with ⌘K / Ctrl+K, or "/" when not typing elsewhere.
import { useNavigate } from "@tanstack/react-router"
import { Command } from "cmdk"
import { Dialog } from "radix-ui"
import { useEffect } from "react"
import { cn } from "@/lib/cn"
import { formatNet } from "@/lib/scan/loudest"
import { useScan } from "@/lib/scan/use-scan"
import { SourceTag } from "../edition/source-tag"

/** Where a coin opens. T33 moves the sky to /sky; until then it is the existing /universe view. */
export const SKY_ROUTE = "/universe" as const

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

export function CoinSearch({ open, onOpenChange }: Props) {
  const scan = useScan()
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      } else if (e.key === "/" && !typing && !open) {
        e.preventDefault()
        onOpenChange(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const rows = [...scan.rows].sort((a, b) => b.net_apr - a.net_apr)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-void/85" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[16svh] left-1/2 z-50 w-[min(560px,calc(100%-32px))] -translate-x-1/2 border border-starlight-faint bg-void text-starlight outline-none"
        >
          <Dialog.Title className="sr-only">Search a coin</Dialog.Title>
          <Command label="Search a coin" loop>
            <div className="flex items-baseline gap-3 border-b border-starlight-faint px-4">
              <span className="label text-starlight-dim" aria-hidden="true">
                ⌕
              </span>
              <Command.Input
                autoFocus
                placeholder="Search a coin by symbol"
                className="min-h-12 w-full bg-transparent font-mono text-base tracking-wide text-starlight placeholder:text-starlight-dim focus:outline-none"
              />
            </div>
            <Command.List className="max-h-[min(52svh,420px)] overflow-y-auto px-2 py-2">
              <Command.Empty className="label px-2 py-4 text-starlight-dim">No coin by that symbol on the board</Command.Empty>
              <Command.Group
                heading={
                  <span className="flex items-baseline justify-between gap-3 px-2 pb-1">
                    <span>{rows.length} coins · net after costs</span>
                    <SourceTag kind={scan.live ? "live" : "sample"} ts={scan.ts ?? undefined} stale={scan.stale} className="text-starlight" />
                  </span>
                }
                className="label text-starlight-dim [&_[cmdk-group-heading]]:pb-1"
              >
                {rows.map((r) => {
                  const alert = r.status === "ok" && r.net_apr > 0
                  return (
                    <Command.Item
                      key={r.symbol}
                      value={r.symbol}
                      onSelect={() => {
                        onOpenChange(false)
                        void navigate({ to: SKY_ROUTE, search: { star: r.symbol } })
                      }}
                      className="grid min-h-10 cursor-pointer grid-cols-[1fr_auto_auto] items-baseline gap-4 px-2 py-1.5 text-starlight-dim data-[selected=true]:bg-starlight/[0.06] data-[selected=true]:text-starlight"
                    >
                      <span className="font-mono text-sm tracking-wide text-starlight">{r.symbol}</span>
                      <span className={cn("figure tabular-nums", alert ? "text-scent" : "text-starlight")}>{formatNet(r.net_apr)}</span>
                      <span className="label w-24 text-right">{r.status === "ok" ? "clean" : "building"}</span>
                    </Command.Item>
                  )
                })}
              </Command.Group>
            </Command.List>
            <p className="label m-0 border-t border-starlight-faint px-4 py-2.5 text-starlight-dim">↵ open on the sky · esc close</p>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
