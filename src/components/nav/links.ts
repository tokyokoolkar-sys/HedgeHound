// The site's pages, in nav order. Shared by the nav, the phone menu and κ's ledger footer, so they never drift.
import { SKY_ROUTE } from "./coin-search"

export const LINKS = [
  { to: "/", label: "Edition" },
  { to: "/scanner", label: "Scanner" },
  { to: SKY_ROUTE, label: "Sky" },
  { to: "/den", label: "Den" },
  { to: "/playbook", label: "Playbook" },
] as const
