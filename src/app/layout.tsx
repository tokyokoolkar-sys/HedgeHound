import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { palette } from "@/lib/palette"
import { Providers } from "./providers"
import "../styles.css"

export const metadata: Metadata = {
  title: { default: "HedgeHound", template: "%s · HedgeHound" },
  description:
    "HedgeHound sniffs funding-rate gaps between Lighter and Binance. Long the cheap hour, short the rich one, paper first.",
  icons: { icon: { url: "/favicon.svg", type: "image/svg+xml" } },
  manifest: "/manifest.webmanifest",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: palette.void,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-void text-starlight" suppressHydrationWarning>
      <body className="bg-void font-sans text-starlight antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
