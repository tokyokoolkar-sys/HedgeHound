import { useEffect, useState } from "react"

/** False during SSR and the first client render, true after mount: for text that depends on client-only state. */
export function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
