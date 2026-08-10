import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { CyberBackground } from "@/components/site/CyberBackground";

export const Route = createFileRoute("/sys-9f4c2a")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Access — BLACK HAT#0 '26" },
      {
        name: "description",
        content: "Restricted console access for BLACK HAT ZERO '26 organisers, coordinators and payment verifiers.",
      },
      { property: "og:title", content: "Staff Access — BLACK HAT#0 '26" },
      { property: "og:description", content: "Restricted console for BLACK HAT ZERO '26 staff." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Access granted.");
    navigate({ to: "/dashboard" });
  };

  const field =
    "w-full border border-input bg-surface px-3 py-3 font-mono text-sm outline-none transition-shadow focus:border-primary focus:shadow-[var(--glow-red)]";

  return (
    <div className="scanlines relative flex min-h-screen items-center justify-center px-6 py-20">
      <div className="grid-bg absolute inset-0 opacity-50" aria-hidden />
      <CyberBackground />
      <div className="panel clip-notch relative w-full max-w-md p-8">
        <div className="flex items-center gap-3">
          <Logo className="h-12 w-12" />
          <div>
            <p className="font-display text-lg font-bold tracking-widest">
              BLACK<span className="text-primary">HAT#0</span>
            </p>
            <p className="font-mono text-[10px] tracking-[0.3em] text-primary">STAFF CONSOLE</p>
          </div>
        </div>

        <h1 className="mt-8 font-display text-2xl font-bold tracking-widest uppercase">
          Authenticate
        </h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Authorised personnel only. All actions are logged.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground">
              EMAIL
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-2 ${field}`}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground">
              PASSWORD
            </span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-2 ${field}`}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="clip-notch w-full bg-primary py-3.5 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase transition-shadow hover:shadow-[var(--glow-red)] disabled:opacity-60"
          >
            {busy ? "AUTHENTICATING..." : "[ Sign in ]"}
          </button>
        </form>

        <Link
          to="/"
          className="mt-6 block text-center font-mono text-[11px] tracking-[0.2em] text-muted-foreground hover:text-primary"
        >
          ← BACK TO SITE
        </Link>
      </div>
    </div>
  );
}
