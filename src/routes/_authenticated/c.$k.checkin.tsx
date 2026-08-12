import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useRef, useState } from "react";
import { QrScanner } from "@/components/staff/QrScanner";
import { toast } from "sonner";
import {
  getCheckinStats,
  getPresentTeams,
  markAttendance,
  redeemFoodToken,
  resolveScan,
} from "@/lib/checkin.functions";
import { releaseFoodTokens } from "@/lib/staff.functions";
import { foodLabel } from "@/lib/schemas";

export const Route = createFileRoute("/_authenticated/c/$k/checkin")({
  component: CheckinPage,
});

type Scan = Awaited<ReturnType<typeof resolveScan>>;

const consoleRoute = getRouteApi("/_authenticated/c/$k");

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel clip-notch p-4">
      <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function CheckinPage() {
  const resolveFn = useServerFn(resolveScan);
  const attendFn = useServerFn(markAttendance);
  const foodFn = useServerFn(redeemFoodToken);
  const statsFn = useServerFn(getCheckinStats);
  const presentFn = useServerFn(getPresentTeams);
  const releaseFn = useServerFn(releaseFoodTokens);
  const qc = useQueryClient();
  const roles = consoleRoute.useLoaderData().roles as string[];
  const canRelease = roles.includes("admin") || roles.includes("super_admin");

  const [code, setCode] = useState("");
  const [scan, setScan] = useState<Scan | null>(null);
  const [camera, setCamera] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const stats = useQuery({ queryKey: ["checkin-stats"], queryFn: () => statsFn() });
  const present = useQuery({ queryKey: ["present-teams"], queryFn: () => presentFn() });

  const release = useMutation({
    mutationFn: (v: { registration_id: string; release: boolean }) =>
      releaseFn({ data: { registration_id: v.registration_id, release: v.release } }),
    onSuccess: (_r, v) => {
      toast.success(v.release ? "Food tokens sent." : "Food tokens withdrawn.");
      qc.invalidateQueries({ queryKey: ["present-teams"] });
      qc.invalidateQueries({ queryKey: ["checkin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lookup = useMutation({
    mutationFn: (value: string) => resolveFn({ data: { code: value } }),
    onSuccess: (r) => setScan(r),
    onError: (e: Error) => {
      setScan(null);
      toast.error(e.message);
    },
  });

  const onCameraResult = useCallback(
    (value: string) => {
      setCamera(false);
      setCode(value);
      lookup.mutate(value);
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    },
    [lookup],
  );

  const confirm = useMutation({
    mutationFn: async () => {
      if (!scan) throw new Error("Scan a code first.");
      return scan.kind === "attendance"
        ? attendFn({ data: { code } })
        : foodFn({ data: { code } });
    },
    onSuccess: (r) => {
      if (r.ok) toast.success("Confirmed.");
      else
        toast.error(
          `Already used${r.already?.at ? ` at ${new Date(r.already.at).toLocaleString()}` : ""}${
            r.already?.by ? ` by ${r.already.by}` : ""
          }.`,
        );
      qc.invalidateQueries({ queryKey: ["checkin-stats"] });
      qc.invalidateQueries({ queryKey: ["present-teams"] });
      lookup.mutate(code);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// CHECK-IN</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-widest uppercase">
          Scan &amp; verify
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Scan a team attendance QR or a participant food-token QR with any scanner app, then paste
          or type the code below.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="CONFIRMED TEAMS" value={String(stats.data?.teams ?? 0)} />
        <Stat label="PRESENT" value={String(stats.data?.present ?? 0)} />
        <Stat label="TOKENS" value={String(stats.data?.total_tokens ?? 0)} />
        <Stat label="RELEASED" value={String(stats.data?.released ?? 0)} />
        <Stat label="REDEEMED" value={String(stats.data?.redeemed ?? 0)} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) lookup.mutate(code.trim());
        }}
        className="panel flex flex-col gap-3 p-5 sm:flex-row"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="BH0-A-…  or  BH0-F-…"
          autoFocus
          className="flex-1 border border-input bg-background px-3 py-3 font-mono text-xs"
        />
        <button
          type="submit"
          disabled={lookup.isPending}
          className="clip-notch bg-primary px-6 py-3 font-mono text-[11px] font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
        >
          [ Look up ]
        </button>
        <button
          type="button"
          onClick={() => {
            setCamera((v) => !v);
          }}
          className="clip-notch border border-border px-6 py-3 font-mono text-[11px] font-bold tracking-[0.2em] uppercase hover:border-primary hover:text-primary"
        >
          {camera ? "[ Close camera ]" : scan ? "[ Scan next ]" : "[ Scan with camera ]"}
        </button>
      </form>

      <QrScanner active={camera} onResult={onCameraResult} onClose={() => setCamera(false)} />

      {scan && (
        <div ref={resultRef} className="panel space-y-3 p-5">
          {scan.kind === "attendance" ? (
            <>
              <p className="font-mono text-[11px] tracking-[0.3em] text-primary">TEAM ATTENDANCE</p>
              <p className="font-display text-xl font-bold tracking-widest uppercase">
                {scan.team_name}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {scan.registration_code} · {scan.team_code} · {scan.status} · {scan.members.length}{" "}
                members
              </p>
              <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
                {scan.members.map((m, i) => (
                  <li key={i}>
                    {String(i + 1).padStart(2, "0")} · {m.full_name} ·{" "}
                    {foodLabel((m as { food_pref?: string }).food_pref ?? "VEG")}
                  </li>
                ))}
              </ul>
              {scan.already ? (
                <p className="font-mono text-xs text-primary">
                  ALREADY MARKED · {new Date(scan.already.at).toLocaleString()} ·{" "}
                  {scan.already.by ?? ""}
                </p>
              ) : (
                <button
                  disabled={!scan.eligible || confirm.isPending}
                  onClick={() => confirm.mutate()}
                  className="clip-notch bg-primary px-6 py-3 font-mono text-[11px] font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
                >
                  [ Mark present ]
                </button>
              )}
            </>
          ) : (
            <>
              <p className="font-mono text-[11px] tracking-[0.3em] text-primary">FOOD TOKEN</p>
              <p className="font-display text-xl font-bold tracking-widest uppercase">
                {scan.full_name}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {scan.team_name} · {scan.student_id} ·{" "}
                <span className="text-primary">{foodLabel(scan.food_pref)}</span>
              </p>
              {scan.already ? (
                <p className="font-mono text-xs text-primary">
                  ALREADY REDEEMED · {new Date(scan.already.at as string).toLocaleString()} ·{" "}
                  {scan.already.by ?? ""}
                </p>
              ) : !scan.released ? (
                <p className="font-mono text-xs text-destructive">NOT RELEASED YET</p>
              ) : (
                <button
                  disabled={confirm.isPending}
                  onClick={() => confirm.mutate()}
                  className="clip-notch bg-primary px-6 py-3 font-mono text-[11px] font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
                >
                  [ Redeem meal ]
                </button>
              )}
            </>
          )}
        </div>
      )}
    
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.3em] text-primary">// PRESENT TEAMS</p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-widest uppercase">
              Marked present ({present.data?.length ?? 0})
            </h2>
          </div>
        </div>

        {present.isLoading ? (
          <p className="font-mono text-xs text-muted-foreground">LOADING...</p>
        ) : (present.data?.length ?? 0) === 0 ? (
          <div className="panel p-5">
            <p className="font-mono text-xs text-muted-foreground">
              No team has been marked present yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {present.data!.map((t) => {
              const all = t.tokens_total > 0 && t.tokens_released === t.tokens_total;
              return (
                <div key={t.registration_id} className="panel clip-notch space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-base font-bold tracking-widest uppercase">
                        {t.team_name}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {t.registration_code} · {t.team_code} · {t.team_size} members
                      </p>
                    </div>
                    <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
                      Present · {new Date(t.marked_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    FOOD TOKENS · {t.tokens_released}/{t.tokens_total || t.team_size} released ·{" "}
                    {t.tokens_redeemed} redeemed
                  </p>
                  {canRelease && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={release.isPending || all}
                      onClick={() =>
                        release.mutate({ registration_id: t.registration_id, release: true })
                      }
                      className="clip-notch bg-primary px-4 py-2 font-mono text-[10px] font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-50"
                    >
                      {all ? "[ Tokens sent ]" : "[ Send food tokens ]"}
                    </button>
                    {t.tokens_released > 0 && (
                      <button
                        disabled={release.isPending}
                        onClick={() =>
                          release.mutate({ registration_id: t.registration_id, release: false })
                        }
                        className="clip-notch border border-border px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase hover:border-primary hover:text-primary disabled:opacity-50"
                      >
                        [ Withdraw ]
                      </button>
                    )}
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
