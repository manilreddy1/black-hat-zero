import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
  notFound,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { verifyConsoleAccess } from "@/lib/security.functions";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/_authenticated/c/$k")({
  // Re-validates the session, the console key and the roles on the server for
  // every single /c request. Client state is never trusted.
  staleTime: 0,
  shouldReload: true,
  loader: async ({ params }) => {
    try {
      const access = await verifyConsoleAccess({ data: { k: params.k } });
      return access;
    } catch {
      throw notFound();
    }
  },
  head: () => ({
    meta: [
      { title: "Control Console — BLACK HAT#0 '26" },
      { name: "description", content: "Internal control console for BLACK HAT ZERO '26 staff." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardLayout,
});

const LINKS = [
  { to: "/c/$k", label: "Overview", roles: ["admin", "coordinator", "payment_verifier"] },
  {
    to: "/c/$k/registrations",
    label: "Registrations",
    roles: ["admin", "coordinator", "payment_verifier"],
  },
  { to: "/c/$k/messages", label: "Messages", roles: ["admin", "coordinator"] },
  { to: "/c/$k/content", label: "Content", roles: ["admin"] },
  { to: "/c/$k/certificates", label: "Certificates", roles: ["admin"] },
  { to: "/c/$k/texts", label: "Website Text", roles: ["admin"] },
  { to: "/c/$k/settings", label: "Settings", roles: ["admin"] },
  { to: "/c/$k/users", label: "Staff", roles: ["admin", "super_admin"] },
  { to: "/c/$k/logs", label: "Audit Logs", roles: ["admin"] },
] as const;

function DashboardLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { k } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const data = Route.useLoaderData();
  const roles = data.roles;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isSuper = roles.includes("super_admin");
  const visibleLinks = LINKS.filter((l) => isSuper || l.roles.some((r) => roles.includes(r)));

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/sys-9f4c2a", replace: true });
  };


  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface/50 p-5 lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-9 w-9" />
          <span className="font-display text-sm font-bold tracking-widest">
            BLACK<span className="text-primary">HAT#0</span>
          </span>
        </Link>
        <p className="mt-8 font-mono text-[10px] tracking-[0.3em] text-primary">CONSOLE</p>
        <nav className="mt-3 flex flex-col gap-1">
          {visibleLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              params={{ k }}
              className={`px-3 py-2 font-mono text-xs tracking-[0.15em] uppercase transition-colors ${
                pathname === l.to.replace("$k", k)
                  ? "border-l-2 border-l-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <p className="font-mono text-[10px] break-all text-muted-foreground">
            {data.profile?.email}
          </p>
          <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
            {roles.join(" · ") || "no role"}
          </p>
          <button
            onClick={signOut}
            className="w-full border border-border py-2 font-mono text-[11px] tracking-[0.2em] uppercase hover:border-primary hover:text-primary"
          >
            [ Sign out ]
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="relative border-b border-border px-4 py-3 lg:hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <span className="truncate font-display text-sm font-bold tracking-widest">
              BLACK<span className="text-primary">HAT#0</span>
            </span>
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close admin menu" : "Open admin menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="grid h-10 w-10 shrink-0 place-items-center border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {mobileMenuOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="panel absolute inset-x-4 top-[calc(100%+8px)] z-30 p-2 shadow-[var(--glow-soft)]" aria-label="Admin menu">
              {visibleLinks.map((l) => {
                const isActive = pathname === l.to.replace("$k", k);
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    params={{ k }}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block border-l-2 px-3 py-3 font-mono text-xs tracking-[0.15em] uppercase transition-colors ${
                      isActive
                        ? "border-l-primary bg-primary/10 text-primary"
                        : "border-l-transparent text-muted-foreground hover:border-l-primary hover:text-foreground"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={signOut}
                className="mt-2 w-full border-t border-border px-3 py-3 text-left font-mono text-xs tracking-[0.15em] text-primary uppercase transition-colors hover:bg-primary/10"
              >
                Sign out
              </button>
            </nav>
          )}
        </header>
        <div className="p-5 sm:p-8">
          {roles.length === 0 ? (
            <div className="panel p-6">
              <p className="font-display text-lg font-bold tracking-widest uppercase">
                No role assigned
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Your account has no staff role yet. Ask an administrator to grant access.
              </p>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
}
