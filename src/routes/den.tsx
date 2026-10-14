import { createFileRoute } from "@tanstack/react-router"
import { DenPage } from "@/components/den/den-page"

export const Route = createFileRoute("/den")({
  head: () => ({ meta: [{ title: "The Den · HedgeHound" }] }),
  component: DenPage,
})
