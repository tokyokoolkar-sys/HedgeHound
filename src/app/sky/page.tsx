import type { Metadata } from "next"
import { Suspense } from "react"
import { SkyRoute } from "./sky-route"

export const metadata: Metadata = { title: "The Sky" }

export default function Page() {
  return (
    <Suspense>
      <SkyRoute />
    </Suspense>
  )
}
