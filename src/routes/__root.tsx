import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CustomCursor } from "@/components/site/CustomCursor";
import { BootLoader } from "@/components/site/BootLoader";
import { siteContentQuery } from "@/hooks/useSiteContent";

function NotFoundComponent() {
  return (
    <div className="scanlines flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary text-glow">404</h1>
        <h2 className="mt-4 font-mono text-sm tracking-[0.3em] text-foreground uppercase">
          Route not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This endpoint doesn't exist or has been taken offline.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="clip-notch inline-flex items-center justify-center bg-primary px-5 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase"
          >
            [ Return to base ]
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="scanlines flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-bold tracking-widest uppercase">
          System fault detected
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Retry the request or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="clip-notch bg-primary px-5 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase"
          >
            [ Retry ]
          </button>
          <a
            href="/"
            className="clip-notch border border-border px-5 py-3 font-mono text-xs font-bold tracking-[0.2em] uppercase"
          >
            [ Go home ]
          </a>
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
      { name: "author", content: "Black Hat Zero" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
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

function SiteChrome() {
  const { data } = useQuery(siteContentQuery);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isStaff = pathname.startsWith("/dashboard") || pathname.startsWith("/auth");
  const settings = data?.settings ?? null;

  return (
    <>
      {!isStaff && <BootLoader />}
      <CustomCursor />
      <div className="flex min-h-screen flex-col">
        {!isStaff && <SiteNav settings={settings} />}
        <main className="flex-1">
          <Outlet />
        </main>
        {!isStaff && <SiteFooter settings={settings} />}
      </div>
      <Toaster position="top-right" />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <SiteChrome />
    </QueryClientProvider>
  );
}
