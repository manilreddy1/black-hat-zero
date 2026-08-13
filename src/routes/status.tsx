import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useT } from "@/hooks/useSiteContent";
import { motion } from "framer-motion";
import { lookupRegistration } from "@/lib/public.functions";
import { formatMoney, STATUS_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/site/StatusBadge";
import { CyberBackground } from "@/components/site/CyberBackground";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Track Registration Status — BLACK HAT#0 '26" },
      {
        name: "description",
        content:
          "Check your BLACK HAT ZERO '26 registration and payment verification status using your registration code, team code or leader email.",
      },
      { property: "og:title", content: "Track Registration Status — BLACK HAT#0 '26" },
      {
        property: "og:description",
        content: "Look up your BLACK HAT ZERO '26 registration and payment verification status.",
      },
    ],
  }),
  component: StatusPage,
});

function StatusPage() {
  const t = useT();
  const lookup = useServerFn(lookupRegistration);
  const [query, setQuery] = useState("");
  const mutation = useMutation({ mutationFn: (q: string) => lookup({ data: { query: q } }) });
  const result = mutation.data;

  return (
    <div className="scanlines relative min-h-screen px-6 pt-28 pb-20">
      <CyberBackground />
      <div className="relative mx-auto max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// STATUS TERMINAL</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.4rem)] leading-none font-bold tracking-tight uppercase">
          {t("status.title", "Trace your registration")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("status.subtitle", "Enter your registration code, team code or team leader email.")}
        </p>

        <form
          className="panel clip-notch mt-8 flex flex-col gap-3 p-5 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim().length >= 4) mutation.mutate(query.trim());
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="BH0-2026-00001"
            className="w-full border border-input bg-surface px-3 py-3 font-mono text-sm outline-none focus:border-primary focus:shadow-[var(--glow-red)]"
          />
          <button
            type="submit"
            disabled={mutation.isPending}
            className="clip-notch bg-primary px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
          >
            {mutation.isPending ? "SCANNING..." : "[ Trace ]"}
          </button>
        </form>

        {result && !result.found && (
          <div className="panel mt-6 border-l-2 border-l-destructive p-5 font-mono text-sm">
            NO RECORD FOUND FOR THAT IDENTIFIER.
          </div>
        )}

        {result?.found && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel clip-notch mt-6 p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-2xl font-bold tracking-widest uppercase">
                  {result.team_name}
                </p>
                <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground">
                  {result.registration_code} · {result.team_code}
                </p>
              </div>
              <StatusBadge status={result.status} />
            </div>

            <div className="mt-6 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
              {[
                ["COLLEGE", result.college],
                ["TEAM SIZE", `${result.team_size} members`],
                ["AMOUNT", formatMoney(result.amount)],
                ["PAYMENT", result.payment_status ?? "NOT SUBMITTED"],
                ["UTR", result.utr_number ?? "—"],
                ["STATE", STATUS_LABELS[result.status] ?? result.status],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface p-4">
                  <p className="font-mono text-[10px] tracking-[0.3em] text-primary">{k}</p>
                  <p className="mt-1 text-sm break-words">{v}</p>
                </div>
              ))}
            </div>

            {result.status === "PAYMENT_REJECTED" && (
              <div className="mt-6 border-l-2 border-l-destructive bg-destructive/10 p-4">
                <p className="font-display text-lg font-bold tracking-widest text-destructive uppercase">
                  Your team has been rejected
                </p>
                <p className="mt-1 text-sm">
                  Reason: {result.rejection_reason ?? "Invalid payment proof."}
                </p>
                <Link
                  to="/payment/$id"
                  params={{ id: result.registration_id }}
                  className="clip-notch mt-4 inline-block bg-primary px-5 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase"
                >
                  {result.retry_requested ? "[ View request status ]" : "[ Request another chance ]"}
                </Link>
              </div>
            )}

            {result.status === "PAYMENT_PENDING" && (
              <Link
                to="/payment/$id"
                params={{ id: result.registration_id }}
                className="clip-notch mt-6 inline-block bg-primary px-5 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase"
              >
                [ Complete payment ]
              </Link>
            )}

          </motion.div>
        )}
      </div>
    </div>
  );
}
