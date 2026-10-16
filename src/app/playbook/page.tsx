import type { Metadata } from "next"
import { PlaybookPage } from "@/components/playbook/playbook-page"

export const metadata: Metadata = { title: "The Playbook" }

export default function Page() {
  return <PlaybookPage />
}
