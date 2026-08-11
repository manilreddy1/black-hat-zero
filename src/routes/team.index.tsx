import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { requestLeadPassword } from "@/lib/lead.functions";
import { Logo } from "@/components/site/Logo";
import { CyberBackground } from "@/components/site/CyberBackground";

export const Route = createFileRoute("/team/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Team Lead Login — BLACK HAT#0 '26" },
      {
        name: "description",
        content:
          "Team leads sign in to view their team, attendance QR and food tokens for BLACK HAT ZERO '26.",
      },
      { property: "og:title", content: "Team Lead Login — BLACK HAT#0 '26" },
      {
        property: "og:description",
        content: "Access your team dashboard, attendance QR and meal tokens.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamLogin,
});

const field =
  "w-full border border-input bg-surface px-3 py-3 font-mono text-sm outline-none transition-shadow focus:border-primary focus:shadow-[var(--glow-red)]";

function TeamLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const addr = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: addr, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const mustChange = Boolean(data.user?.user_metadata?.["must_change_password"]);
    navigate({ to: mustChange ? "/team/set-password" : "/team/portal" });
  };

  const forgot = async () => {
    const addr = email.trim().toLowerCase();
    if (!addr) {
      toast.error("Enter your leader email first.");
      return;
    }
    setBusy(true);
    await requestLeadPassword({ data: { email: addr, origin: window.location.origin } }).catch(
      (err: Error) => toast.error(err.message),
    );
    setBusy(false);
    toast.success(
      "If that email belongs to a registered team lead, a new temporary password is on its way.",
    );
  };

  return (
    <div className="scanlines relative flex min-h-screen items-center justify-center px-6 py-20">
      <div className="grid-bg absolute inset-0 opacity-50" aria-hidden />
      <CyberBackground />
      <div className="panel clip-notch relative w-full max-w-md p-8">
        <div className="flex items-center gap-3">
          <Logo className="h-12 w-12" />
          <div>
            <p className="font-mono text-[10px] tracking-[0.4em] text-primary">// TEAM LEAD</p>
            <h1 className="font-display text-xl font-bold tracking-widest uppercase">
              Team portal
            </h1>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Your login is created automatically once your team is marked registered — a temporary
          password is sent to the leader's inbox. You'll set your own password on first sign-in.
        </p>

        <form onSubmit={signIn} className="mt-6 space-y-4">
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
              LEADER EMAIL
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-2 ${field}`}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
              PASSWORD
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-2 ${field}`}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="clip-notch w-full bg-primary py-3 font-mono text-[11px] font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
          >
            {busy ? "[ Authenticating… ]" : "[ Sign in ]"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between font-mono text-[11px]">
          <button onClick={forgot} disabled={busy} className="text-primary hover:underline">
            Email me a new password
          </button>
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
