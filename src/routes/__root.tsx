import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportAppError } from "../lib/error-reporting";
import { Toaster } from "@/components/ui/sonner";

/**
 * After a new deploy, a visitor's already-open tab (or one opened right as
 * the deploy finished) can still be holding references to the PREVIOUS
 * build's JS chunk filenames. Those old chunks no longer exist on the
 * server, so any dynamic import() for a route/component fails with this
 * error. It is not a code bug — it's a stale-build mismatch — and the fix
 * is simply to reload the page once, which fetches the current index.html
 * and its correct (current) chunk references.
 */
const RELOAD_GUARD_KEY = "zyvro_chunk_reload_once";

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed/i.test(
    message,
  );
}

function reloadOnceForStaleChunk() {
  if (typeof window === "undefined") return;
  // Guard against an infinite reload loop if something is genuinely broken
  // server-side (in which case we fall through to the normal error UI).
  if (window.sessionStorage.getItem(RELOAD_GUARD_KEY)) return;
  window.sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
  window.location.reload();
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl gold-gradient-text">404</h1>
        <h2 className="mt-4 font-display text-xl tracked-wide">Off the map.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <a href="/" className="btn-zy-outline">Return home</a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportAppError(error, { boundary: "tanstack_root_error_component" });
    if (isChunkLoadError(error)) reloadOnceForStaleChunk();
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl tracked-wide">Something broke.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="btn-zy !py-3 !text-xs"
          >
            Retry
          </button>
          <a href="/" className="btn-zy-outline !py-3 !text-xs">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ZYVRO — Premium Streetwear · Own Your Style" },
      {
        name: "description",
        content:
          "ZYVRO — Premium Bangladeshi streetwear. Oversized drop-shoulder tees. Limited drops. Built different.",
      },
      { name: "author", content: "ZYVRO" },
      { name: "theme-color", content: "#0A0A0A" },
      { property: "og:title", content: "ZYVRO — Premium Streetwear" },
      {
        property: "og:description",
        content:
          "Own your style. Premium oversized streetwear from Bangladesh. Limited edition drops.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ZYVRO — Own Your Style" },
      {
        name: "twitter:description",
        content: "Premium oversized streetwear. Limited drops. Built different.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/favicon.png", type: "image/png", sizes: "512x512" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    // Vite fires this specific event when a dynamic import() 404s because
    // the browser is holding chunk references from a build that's since
    // been replaced by a new deploy. Reload once to pick up the current build.
    const handler = () => reloadOnceForStaleChunk();
    window.addEventListener("vite:preloadError", handler);
    // Clear the one-time guard after the app has been stable for a bit, so
    // a *later* genuine stale-chunk event (e.g. another deploy happens
    // while this tab stays open) can still trigger one more auto-reload.
    const clearGuard = window.setTimeout(() => {
      window.sessionStorage.removeItem(RELOAD_GUARD_KEY);
    }, 5000);
    return () => {
      window.removeEventListener("vite:preloadError", handler);
      window.clearTimeout(clearGuard);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme="dark" position="top-center" />
    </QueryClientProvider>
  );
}
