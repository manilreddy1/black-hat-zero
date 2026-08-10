import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
  notFound,
} from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/staff.functions";
import { getConsoleKey } from "@/lib/console.functions";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/_authenticated/c/$k")({
  loader: async ({ params }) => {
    const { key } = await getConsoleKey();
    if (key !== params.k) throw notFound();
    return { key };
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
  { to: "/c/$k/users", label: "Staff", roles: ["admin"] },
  { to: "/c/$k/logs", label: "Audit Logs", roles: ["admin"] },
] as const;

function DashboardLayout() {
  const me = useServerFn(getMe);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { k } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => me() });
  const roles = data?.roles ?? [];

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
          {LINKS.filter((l) => l.roles.some((r) => roles.includes(r))).map((l) => (
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
            {data?.profile?.email}
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
        <header className="flex items-center justify-between gap-3 overflow-x-auto border-b border-border px-5 py-3 lg:hidden">
          <span className="font-display text-sm font-bold tracking-widest">
            BLACK<span className="text-primary">HAT#0</span>
          </span>
          <div className="flex gap-2">
            {LINKS.filter((l) => l.roles.some((r) => roles.includes(r))).map((l) => (
              <Link
                key={l.to}
                to={l.to}
                params={{ k }}
                className="font-mono text-[10px] tracking-[0.15em] whitespace-nowrap text-muted-foreground uppercase"
              >
                {l.label}
              </Link>
            ))}
            <button onClick={signOut} className="font-mono text-[10px] text-primary uppercase">
              Exit
            </button>
          </div>
        </header>
        <div className="p-5 sm:p-8">
          {roles.length === 0 && data ? (
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
