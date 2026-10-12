import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useState } from "react";
import { AuthProvider } from "@/lib/auth/provider";
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
  component: RootDocument,
});

function RootDocument() {
  // One client per document: created in state so SSR requests never share cache.
  const [queryClient] = useState(() => new QueryClient());
  return (
    <html lang="en" className="bg-bg text-fg" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg font-sans text-fg antialiased">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SiteNav />
            <Outlet />
          </AuthProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
