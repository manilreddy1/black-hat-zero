import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { supabase } from "@/integrations/supabase/client";
import { getMyTeam } from "@/lib/lead.functions";
import { foodLabel } from "@/lib/schemas";
import { StatusBadge } from "@/components/site/StatusBadge";
import { WhatsAppLink } from "@/components/site/WhatsAppLink";

export const Route = createFileRoute("/team/portal")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Team Dashboard — BLACK HAT#0 '26" },
      {
        name: "description",
        content: "Your team details, attendance QR and meal tokens for BLACK HAT ZERO '26.",
      },
      { property: "og:title", content: "Team Dashboard — BLACK HAT#0 '26" },
      { property: "og:description", content: "Team details, attendance QR and meal tokens." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeamPortal,
});

function QRPanel({ title, note, value }: { title: string; note?: string; value: string }) {
  return (
    <div className="panel clip-notch p-5 text-center">
      <p className="font-mono text-[10px] tracking-[0.3em] text-primary">{title}</p>
      <div className="mx-auto mt-4 w-fit bg-white p-3">
        <QRCode value={value} size={148} />
      </div>
      {note && <p className="mt-3 font-mono text-[10px] text-muted-foreground">{note}</p>}
    </div>
  );
}

function TeamPortal() {
  const navigate = useNavigate();
  const fn = useServerFn(getMyTeam);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) navigate({ to: "/team", replace: true });
      else if (data.user.user_metadata?.["must_change_password"])
        navigate({ to: "/team/set-password", replace: true });
      else setReady(true);
    });
  }, [navigate]);

  const q = useQuery({ queryKey: ["my-team"], queryFn: () => fn(), enabled: ready });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/team", replace: true });
  };

  if (!ready || q.isLoading)
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground">LOADING TEAM...</p>
      </div>
    );

  const d = q.data;

  return (
    <div className="min-h-screen px-5 py-10 sm:px-8">
      <header className="mx-auto flex max-w-5xl items-center justify-end">
        <button
          onClick={signOut}
          className="border border-border px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase hover:border-primary hover:text-primary"
        >
          [ Sign out ]
        </button>
      </header>

      {!d?.team ? (
        <div className="panel mx-auto mt-10 max-w-2xl p-6">
          <p className="font-display text-lg font-bold tracking-widest uppercase">No team found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This account isn't linked to a registered team yet. Team portals open once your payment
            is verified and the team is marked registered.
          </p>
        </div>
      ) : (
        <main className="mx-auto mt-10 max-w-5xl space-y-8">
          <div>
            <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// TEAM PORTAL</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-widest uppercase">
              {d.team.team_name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
              <span>{d.registration.registration_code}</span>
              <span>· {d.team.team_code}</span>
              <span>· {d.team.college}</span>
              <span>· {d.registration.team_size} members</span>
              <StatusBadge status={d.registration.status} />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {d.attendance_qr ? (
              <QRPanel
                title="TEAM ATTENDANCE QR"
                value={d.attendance_qr}
                note={
                  d.attendance
                    ? `MARKED PRESENT · ${new Date(d.attendance.marked_at).toLocaleString()}`
                    : "Show this to a coordinator at the venue."
                }
              />
            ) : (
              <div className="panel p-5">
                <p className="font-mono text-[10px] tracking-[0.3em] text-primary">
                  TEAM ATTENDANCE QR
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Available once your registration is confirmed.
                </p>
              </div>
            )}
            <div className="panel p-5">
              <p className="font-mono text-[10px] tracking-[0.3em] text-primary">PAYMENT</p>
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                UTR: {d.payment?.utr_number ?? "—"}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Amount: ₹{d.registration.expected_amount} · {d.payment?.status ?? "—"}
              </p>
            </div>
          </div>

          <div>
            <p className="font-mono text-[11px] tracking-[0.3em] text-primary">
              THEMES &amp; PROBLEM STATEMENTS
            </p>
            {d.themes_revealed && d.themes.length > 0 ? (
              <div className="mt-4 grid gap-5 lg:grid-cols-2">
                {d.themes.map((t, i) => (
                  <article key={t.id} className="panel clip-notch p-5">
                    <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
                      THEME {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-2 font-display text-lg font-bold tracking-widest uppercase">
                      {t.title}
                    </h3>
                    {t.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
                    )}
                    {t.problem_statement && (
                      <div className="mt-4 border-l-2 border-primary/60 pl-3">
                        <p className="font-mono text-[10px] tracking-[0.3em] text-primary">
                          PROBLEM STATEMENT
                        </p>
                        <p className="mt-2 text-sm whitespace-pre-line">{t.problem_statement}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="panel mt-4 p-5">
                <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
                  // LOCKED — THEMES NOT RELEASED YET
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The themes and problem statements are sealed until the organisers release them.
                  They will appear here automatically — keep this page handy on event day.
                </p>
              </div>
            )}
          </div>


          <div>
            <p className="font-mono text-[11px] tracking-[0.3em] text-primary">
              PARTICIPANTS &amp; FOOD TOKENS
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {d.members.map((m) => (
                <div key={m.id} className="panel p-5">
                  <p className="font-display text-sm font-bold tracking-widest uppercase">
                    {m.full_name}
                    {m.is_leader && <span className="ml-2 text-primary">· LEAD</span>}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {m.student_id} · {foodLabel(m.food_pref)}
                  </p>
                  {m.food_qr ? (
                    <>
                      <div className="mx-auto mt-4 w-fit bg-white p-3">
                        <QRCode value={m.food_qr} size={120} />
                      </div>
                      <p className="mt-3 text-center font-mono text-[10px] text-muted-foreground">
                        {m.food_redeemed_at
                          ? `REDEEMED · ${new Date(m.food_redeemed_at).toLocaleString()}`
                          : "One-time meal token"}
                      </p>
                    </>
                  ) : (
                    <p className="mt-4 font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
                      FOOD TOKEN NOT RELEASED YET
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
