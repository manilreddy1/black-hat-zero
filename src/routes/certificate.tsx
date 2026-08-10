import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { getCertificateConfig, lookupCertificate } from "@/lib/certificates.functions";
import { CertificateCanvas, downloadCanvas } from "@/components/site/CertificateCanvas";
import { CyberBackground } from "@/components/site/CyberBackground";

export const Route = createFileRoute("/certificate")({
  head: () => ({
    meta: [
      { title: "Participation Certificate — BLACK HAT#0 '26" },
      {
        name: "description",
        content:
          "Download your BLACK HAT ZERO '26 participation certificate using your registration code, team code or team leader email.",
      },
      { property: "og:title", content: "Participation Certificate — BLACK HAT#0 '26" },
      {
        property: "og:description",
        content: "Verified participants can download their BLACK HAT ZERO '26 certificate here.",
      },
    ],
  }),
  component: CertificatePage,
});

function CertificatePage() {
  const lookup = useServerFn(lookupCertificate);
  const config = useServerFn(getCertificateConfig);
  const { data: cfg, isLoading } = useQuery({
    queryKey: ["certificate-config"],
    queryFn: () => config(),
  });
  const [query, setQuery] = useState("");
  const [member, setMember] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const mutation = useMutation({
    mutationFn: (q: string) => lookup({ data: { query: q } }),
    onSuccess: (r) => setMember(r.found ? (r.members[0] ?? null) : null),
  });
  const result = mutation.data;

  if (isLoading) return <div className="min-h-screen" />;

  if (!cfg?.is_enabled) {
    return (
      <div className="scanlines relative min-h-screen px-6 pt-28 pb-20">
        <CyberBackground />
        <div className="relative mx-auto max-w-2xl">
          <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// CERTIFICATES</p>
          <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.4rem)] leading-none font-bold tracking-tight uppercase">
            Not available yet
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Participation certificates will be released here after the event.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block border border-border px-5 py-3 font-mono text-xs tracking-[0.2em] uppercase hover:border-primary hover:text-primary"
          >
            [ Back home ]
          </Link>
        </div>
      </div>
    );
  }

  const values =
    result?.found && member
      ? {
          name: member,
          team: result.team_name,
          college: result.college,
          code: result.registration_code,
          event: result.event_name,
          date: result.event_date,
        }
      : null;

  return (
    <div className="scanlines relative min-h-screen px-6 pt-28 pb-20">
      <CyberBackground />
      <div className="relative mx-auto max-w-4xl">
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// CERTIFICATE VAULT</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.4rem)] leading-none font-bold tracking-tight uppercase">
          {cfg.section_title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{cfg.section_subtitle}</p>

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
            placeholder="BH0-2026-00001 / team code / leader email"
            className="w-full border border-input bg-surface px-3 py-3 font-mono text-sm outline-none focus:border-primary focus:shadow-[var(--glow-red)]"
          />
          <button
            type="submit"
            disabled={mutation.isPending}
            className="clip-notch bg-primary px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
          >
            {mutation.isPending ? "SEARCHING..." : "[ Fetch ]"}
          </button>
        </form>

        <p className="mt-3 font-mono text-[11px] text-muted-foreground">{cfg.note}</p>

        {mutation.isError && (
          <div className="panel mt-6 border-l-2 border-l-destructive p-5 font-mono text-sm">
            {(mutation.error as Error).message}
          </div>
        )}

        {result && !result.found && (
          <div className="panel mt-6 border-l-2 border-l-destructive p-5 font-mono text-sm">
            {result.reason === "throttled" || result.reason === "disabled"
              ? result.message.toUpperCase()
              : result.reason === "not_verified"
                ? "THIS REGISTRATION IS NOT VERIFIED YET."
                : `NO RECORD FOUND FOR THAT IDENTIFIER.${result.message ? ` ${result.message.toUpperCase()}` : ""}`}
          </div>
        )}


        {result?.found && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel clip-notch mt-6 p-6"
          >
            <p className="font-display text-xl font-bold tracking-widest uppercase">
              {result.team_name}
            </p>
            <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground">
              {result.registration_code}
            </p>

            <p className="mt-6 font-mono text-[10px] tracking-[0.3em] text-primary uppercase">
              Select participant
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.members.map((m) => (
                <button
                  key={m}
                  onClick={() => setMember(m)}
                  className={`px-4 py-2 font-mono text-[11px] tracking-[0.15em] uppercase ${
                    m === member
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {cfg.template_url && values ? (
              <div className="mt-6">
                <div className="border border-border bg-surface p-2">
                  <CertificateCanvas
                    templateUrl={cfg.template_url}
                    fields={cfg.fields}
                    values={values}
                    onReady={(c) => (canvasRef.current = c)}
                  />
                </div>
                <button
                  onClick={() =>
                    canvasRef.current &&
                    downloadCanvas(
                      canvasRef.current,
                      `certificate-${result.registration_code}-${member}.png`,
                    )
                  }
                  className="clip-notch mt-4 bg-primary px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase"
                >
                  [ Download certificate ]
                </button>
              </div>
            ) : (
              <p className="mt-6 font-mono text-xs text-muted-foreground">
                The certificate template has not been published yet.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
