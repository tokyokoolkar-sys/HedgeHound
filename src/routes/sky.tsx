import { createFileRoute } from "@tanstack/react-router"
import { SkyPage } from "@/components/sky/sky-page"

/** `star`: the coin in focus. */
export type SkySearch = { star?: string }

export const Route = createFileRoute("/sky")({
  validateSearch: (search: Record<string, unknown>): SkySearch => ({
    star: typeof search.star === "string" && /^[A-Za-z0-9._-]{1,24}$/.test(search.star) ? search.star.toUpperCase() : undefined,
  }),
  head: () => ({ meta: [{ title: "The Sky · HedgeHound" }] }),
  component: SkyRoute,
})

function SkyRoute() {
  const { star } = Route.useSearch()
  return <SkyPage star={star} />
}
