"use client"
// The site's navigation layer (M0): the TanStack Router shapes the pages were written against (`to` + `search`
// + `hash`, `navigate({ search: prev => … })`), on top of next/navigation. Pages import from here, never from
// next/link or next/navigation directly, so a route's address is built in one place.
import NextLink from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, type ComponentProps } from "react"

export type Search = Record<string, string | number | boolean | undefined>

/** `/sky` + `{ star: "BTC" }` + `"x"` → `/sky?star=BTC#x`. Empty values are left out. */
export function hrefFor(to: string, search?: Search, hash?: string): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(search ?? {})) if (v !== undefined && v !== "") q.set(k, String(v))
  const qs = q.toString()
  return `${to}${qs ? `?${qs}` : ""}${hash ? `#${hash}` : ""}`
}

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & { to: string; search?: Search; hash?: string }

export function Link({ to, search, hash, ...rest }: LinkProps) {
  return <NextLink href={hrefFor(to, search, hash)} {...rest} />
}

/** The current path, without the query. */
export const usePath = usePathname

/** The current query as a plain object (the shape the pages' parsers take). Needs a <Suspense> above it. */
export function useQuery(): Record<string, string> {
  return Object.fromEntries(useSearchParams().entries())
}

type NavigateOpts<S extends Search> = {
  to: string
  search?: S | ((prev: S) => S)
  hash?: string
  replace?: boolean
  /** false: keep the scroll position (filters, focus changes). */
  resetScroll?: boolean
  /** Rewrite the address in place (History API) even when the path changes, e.g. /sky/BTC → /sky/ETH:
   *  the page stays mounted and nothing is fetched. Only for moves inside one page. */
  shallow?: boolean
}

export function useNavigate() {
  const router = useRouter()
  return useCallback(
    <S extends Search>({ to, search, hash, replace, resetScroll = true, shallow }: NavigateOpts<S>) => {
      const prev = Object.fromEntries(new URLSearchParams(window.location.search).entries()) as S
      const next = typeof search === "function" ? search(prev) : search
      const href = hrefFor(to, next, hash)
      // Same page, new query (filters) or a shallow move (sky focus): the History API, which Next syncs into
      // usePathname/useSearchParams without a server round trip or a scroll.
      if (shallow || to === window.location.pathname) {
        if (replace) window.history.replaceState(null, "", href)
        else window.history.pushState(null, "", href)
        if (resetScroll) window.scrollTo(0, 0)
        return
      }
      if (replace) router.replace(href, { scroll: resetScroll })
      else router.push(href, { scroll: resetScroll })
    },
    [router],
  )
}
