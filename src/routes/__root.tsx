import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteNav } from "@/components/nav";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "HedgeHound" },
      {
        name: "description",
        content:
          "HedgeHound sniffs funding-rate gaps between Lighter and Binance. Long the cheap hour, short the rich one, paper first.",
      },
      { name: "theme-color", content: "#090705" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="en" className="bg-bg text-fg" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg font-sans text-fg antialiased">
        <PreviewHostBridge />
        <AuthProvider>
          <SiteNav />
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
