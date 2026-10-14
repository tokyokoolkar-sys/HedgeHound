import { createFileRoute, redirect } from "@tanstack/react-router"

// The old Grok-built universe view is gone (T33): /universe now lands on /sky, keeping the coin in focus.
export const Route = createFileRoute("/universe")({
  beforeLoad: ({ search }) => {
    const star = (search as { star?: unknown }).star
    throw redirect({ to: "/sky", search: { star: typeof star === "string" ? star : undefined }, replace: true })
  },
})
