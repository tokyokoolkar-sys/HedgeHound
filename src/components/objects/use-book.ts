// The paper book's settings, read from this browser (lib/scent.ts readBook). Client-only: during SSR and the
// first render it is the defaults, flagged as such, so server and client agree.
import { useEffect, useState } from "react"
import { DEFAULT_BOOK, SETTINGS_KEY, readBook, type BookSettings } from "@/lib/scent"

export function useBook(): { book: BookSettings; saved: boolean } {
  const [state, setState] = useState<{ book: BookSettings; saved: boolean }>({ book: DEFAULT_BOOK, saved: false })
  useEffect(() => {
    const read = () => {
      let saved = false
      try {
        saved = localStorage.getItem(SETTINGS_KEY) != null
      } catch {
        saved = false
      }
      setState({ book: readBook(), saved })
    }
    read()
    window.addEventListener("storage", read)
    return () => window.removeEventListener("storage", read)
  }, [])
  return state
}
