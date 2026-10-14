import { createFileRoute } from "@tanstack/react-router"
import { SkyPage } from "@/components/sky/sky-page"

/** `star`: the coin in focus. `fx`: the focus prototype switch (T33, owner to pick: reading | fly). */
export type SkySearch = { star?: string; fx?: "fly" }

export const Route = createFileRoute("/sky")({
  validateSearch: (search: Record<string, unknown>): SkySearch => ({
    star: typeof search.star === "string" && /^[A-Za-z0-9._-]{1,24}$/.test(search.star) ? search.star.toUpperCase() : undefined,
    fx: search.fx === "fly" ? "fly" : undefined,
  }),
  head: () => ({ meta: [{ title: "The Sky · HedgeHound" }] }),
  component: SkyRoute,
})

function SkyRoute() {
  const { star, fx } = Route.useSearch()
  return <SkyPage star={star} fx={fx} />
}
