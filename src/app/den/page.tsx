import type { Metadata } from "next"
import { DenPage } from "@/components/den/den-page"

export const metadata: Metadata = { title: "The Den" }

export default function Page() {
  return <DenPage />
}
