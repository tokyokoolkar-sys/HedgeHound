import { createFileRoute } from "@tanstack/react-router"
import { PlaybookPage } from "@/components/playbook/playbook-page"

export const Route = createFileRoute("/playbook")({
  head: () => ({ meta: [{ title: "The Playbook · HedgeHound" }] }),
  component: PlaybookPage,
})
