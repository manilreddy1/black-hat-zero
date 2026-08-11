import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { CyberBackground } from "@/components/site/CyberBackground";

export const Route = createFileRoute("/team/set-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set Team Password — BLACK HAT#0 '26" },
      {
        name: "description",
        content: "Set the password for your BLACK HAT ZERO '26 team lead portal account.",
      },
      { property: "og:title", content: "Set Team Password — BLACK HAT#0 '26" },
      { property: "og:description", content: "Set your team lead portal password." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SetPassword,
});

function SetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setHasSession(true);
    });
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 10) {
      toast.error("Use at least 10 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password set. Welcome in.");
    navigate({ to: "/team/portal", replace: true });
  };

  const field =
    "mt-2 w-full border border-input bg-surface px-3 py-3 font-mono text-sm outline-none focus:border-primary";

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
              Set your password
            </h1>
          </div>
        </div>

        {!hasSession ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Your session has expired. Sign in with your temporary password again to continue.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
                NEW PASSWORD
              </span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={field}
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
                CONFIRM PASSWORD
              </span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={field}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="clip-notch w-full bg-primary py-3 font-mono text-[11px] font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
            >
              {busy ? "[ Saving… ]" : "[ Save password ]"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
