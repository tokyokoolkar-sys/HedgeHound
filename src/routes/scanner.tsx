import { createFileRoute } from "@tanstack/react-router"
import { ScannerPage } from "@/components/scanner/scanner-page"
import { parseScannerSearch, type ScannerSearch } from "@/lib/scan/table"

export const Route = createFileRoute("/scanner")({
  validateSearch: (search: Record<string, unknown>): ScannerSearch => parseScannerSearch(search),
  head: () => ({ meta: [{ title: "The Scanner · HedgeHound" }] }),
  component: ScannerRoute,
})

function ScannerRoute() {
  return <ScannerPage search={Route.useSearch()} />
}
