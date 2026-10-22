import type { Metadata } from "next"
import type { ReactNode } from "react"
import { SkyRoute } from "./sky-route"

export const metadata: Metadata = { title: "The Sky" }

/**
 * The sky page lives in the layout, not the page: a layout stays mounted while its child segment changes, so
 * moving from /sky/BTC to /sky/ETH keeps the atlas, its tween and the camera instead of remounting them.
 * The pages under it only carry the address (and its title).
 */
export default function SkyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkyRoute />
      {children}
    </>
  )
}
