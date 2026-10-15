// Where keyboard focus goes back to when a dialog closes: the last element focused outside any dialog (the
// button that opened it, or nothing for ⌘K / "/" from the page). Radix can't know, because these dialogs are
// opened from state and shortcuts, not from a Dialog.Trigger (P4 critique: focus fell to <body>).
import { useEffect, useRef } from "react"

export function useOpener() {
  const last = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const on = (e: FocusEvent) => {
      const t = e.target
      if (t instanceof HTMLElement && !t.closest("[role=dialog]")) last.current = t
    }
    window.addEventListener("focusin", on)
    return () => window.removeEventListener("focusin", on)
  }, [])
  /** For Dialog.Content's onCloseAutoFocus. */
  return (e: Event) => {
    const el = last.current
    if (!el || !el.isConnected || el === document.body) return
    e.preventDefault()
    el.focus()
  }
}
