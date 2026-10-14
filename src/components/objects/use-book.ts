// The paper book's settings, read from this browser (lib/scent.ts readBook). Client-only: during SSR and the
// first render it is the defaults, flagged as such, so server and client agree. /den edits it (saveBook,
// clearBook); every reader (ι, the orb, the travelling coins, /den) follows at once, other tabs via "storage".
import { useEffect, useState } from "react"
import { DEFAULT_BOOK, SETTINGS_KEY, readBook, writeBook, type BookSettings } from "@/lib/scent"

const EVENT = "hedgehound:book"

export function saveBook(book: BookSettings) {
  try {
    writeBook(book)
  } catch {
    // Storage blocked (private window): the change still applies to this page.
  }
  window.dispatchEvent(new CustomEvent<BookSettings>(EVENT, { detail: book }))
}

/** Back to the defaults: forget what this browser saved. */
export function clearBook() {
  try {
    localStorage.removeItem(SETTINGS_KEY)
  } catch {
    // Nothing saved, or storage blocked.
  }
  window.dispatchEvent(new CustomEvent<BookSettings>(EVENT, { detail: DEFAULT_BOOK }))
}

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
    // A blocked store can't be re-read, so take the edited book from the event itself.
    const edited = (e: Event) => {
      const book = (e as CustomEvent<BookSettings>).detail
      let saved = false
      try {
        saved = localStorage.getItem(SETTINGS_KEY) != null
      } catch {
        saved = false
      }
      setState({ book, saved })
    }
    read()
    window.addEventListener("storage", read)
    window.addEventListener(EVENT, edited)
    return () => {
      window.removeEventListener("storage", read)
      window.removeEventListener(EVENT, edited)
    }
  }, [])
  return state
}
