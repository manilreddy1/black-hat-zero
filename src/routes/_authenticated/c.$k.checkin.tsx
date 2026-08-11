import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  getCheckinStats,
  markAttendance,
  redeemFoodToken,
  resolveScan,
} from "@/lib/checkin.functions";
import { foodLabel } from "@/lib/schemas";

export const Route = createFileRoute("/_authenticated/c/$k/checkin")({
  component: CheckinPage,
});

type Scan = Awaited<ReturnType<typeof resolveScan>>;

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
  const qc = useQueryClient();

  const [code, setCode] = useState("");
  const [scan, setScan] = useState<Scan | null>(null);

  const stats = useQuery({ queryKey: ["checkin-stats"], queryFn: () => statsFn() });

  const lookup = useMutation({
    mutationFn: (value: string) => resolveFn({ data: { code: value } }),
    onSuccess: (r) => setScan(r),
    onError: (e: Error) => {
      setScan(null);
      toast.error(e.message);
    },
  });

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
      </form>

      {scan && (
        <div className="panel space-y-3 p-5">
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
    </div>
  );
}
