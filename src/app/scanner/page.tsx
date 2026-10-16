import type { Metadata } from "next"
import { Suspense } from "react"
import { ScannerRoute } from "./scanner-route"

export const metadata: Metadata = { title: "The Scanner" }

export default function Page() {
  return (
    <Suspense>
      <ScannerRoute />
    </Suspense>
  )
}
