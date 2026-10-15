import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useState } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { SiteNav } from "@/components/nav/site-nav";
import { palette } from "@/lib/palette";
import { ScrollEngine } from "@/lib/motion/scroll-engine";
import { SkyHost } from "@/components/stage/sky-host";
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
      { name: "theme-color", content: palette.void },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      // Our own manifest (the template's is named "Grok App"; P4 close).
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  // One client per document: created in state so SSR requests never share cache.
  const [queryClient] = useState(() => new QueryClient());
  return (
    <html lang="en" className="bg-void text-starlight" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-void font-sans text-starlight antialiased">
        <QueryClientProvider client={queryClient}>
          {/* T11: smooth scroll + section progress for every page (effects only; nothing renders). */}
          <ScrollEngine />
          {/* T12: the one sky canvas; dormant until a page calls useRequestSky(). */}
          <SkyHost />
          <AuthProvider>
            <a
              href="#content"
              className="label fixed top-2 left-2 z-[60] -translate-y-16 bg-void px-3 py-2 text-starlight focus-visible:translate-y-0"
            >
              Skip to content
            </a>
            <SiteNav />
            <div id="content" tabIndex={-1} className="outline-none">
              <Outlet />
            </div>
          </AuthProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
