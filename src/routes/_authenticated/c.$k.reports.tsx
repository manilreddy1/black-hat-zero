import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { getReports } from "@/lib/reports.functions";
import { foodLabel } from "@/lib/schemas";

export const Route = createFileRoute("/_authenticated/c/$k/reports")({
  component: ReportsPage,
});

type Row = Record<string, unknown>;

const fmt = (v: string | null | undefined) => (v ? new Date(v).toLocaleString() : "—");

function toCsv(rows: Row[]) {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

function download(name: string, rows: Row[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel clip-notch p-4">
      <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  if (rows.length === 0)
    return <p className="panel p-5 font-mono text-xs text-muted-foreground">NO RECORDS.</p>;
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-b border-border">
            {head.map((h) => (
              <th
                key={h}
                className="px-3 py-3 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2.5 font-mono text-[11px]">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TABS = [
  { id: "present", label: "Present teams" },
  { id: "absent", label: "Not arrived" },
  { id: "meals", label: "Meals redeemed" },
  { id: "participants", label: "Participants" },
  { id: "registrations", label: "Registrations" },
] as const;

const parentApi = getRouteApi("/_authenticated/c/$k");

function ReportsPage() {
  const fn = useServerFn(getReports);
  const roles = parentApi.useLoaderData().roles as string[];
  const isViewOnly =
    !roles.some((r) => r === "admin" || r === "super_admin") && roles.includes("coordinator");
  const q = useQuery({ queryKey: ["reports"], queryFn: () => fn(), refetchInterval: 20000 });
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("present");
  const [search, setSearch] = useState("");
  const d = q.data;


  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list: Row[] = d ? ((d[tab] as unknown as Row[]) ?? []) : [];
    if (!term) return list;
    return list.filter((r) => JSON.stringify(r).toLowerCase().includes(term));
  }, [d, tab, search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// REPORTS</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-widest uppercase">
            Event reports
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Live attendance, meal redemption and registration records.
            {isViewOnly ? " View only." : " Export any list as CSV."}
          </p>
        </div>
        {!isViewOnly && (
          <button
            onClick={() => download(tab, filtered)}
            disabled={filtered.length === 0}
            className="clip-notch bg-primary px-5 py-3 font-mono text-[11px] font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-50"
          >
            [ Export CSV ]
          </button>
        )}

      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="TEAMS PRESENT" value={`${d?.summary.teams_present ?? 0}/${d?.summary.teams_confirmed ?? 0}`} />
        <Stat label="PARTICIPANTS PRESENT" value={`${d?.summary.participants_present ?? 0}/${d?.summary.participants_total ?? 0}`} />
        <Stat label="MEALS REDEEMED" value={`${d?.summary.tokens_redeemed ?? 0}/${d?.summary.tokens_released ?? 0}`} />
        <Stat label="VEG / NON-VEG EATEN" value={`${d?.summary.veg_redeemed ?? 0} / ${d?.summary.nonveg_redeemed ?? 0}`} />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`clip-notch border px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase ${
              tab === t.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, team, code…"
        className="w-full border border-input bg-background px-3 py-3 font-mono text-xs sm:max-w-sm"
      />

      {q.isLoading ? (
        <p className="font-mono text-xs text-muted-foreground">LOADING...</p>
      ) : q.error ? (
        <p className="panel p-5 font-mono text-xs text-destructive">{(q.error as Error).message}</p>
      ) : tab === "meals" ? (
        <Table
          head={["Participant", "Team", "Roll", "Pref", "Released", "Redeemed", "By"]}
          rows={(filtered as unknown as NonNullable<typeof d>["meals"]).map((m) => [
            m.full_name,
            `${m.team_name} · ${m.team_code}`,
            m.student_id,
            foodLabel(m.food_pref),
            m.released ? fmt(m.released_at) : "not released",
            fmt(m.redeemed_at),
            m.redeemed_by ?? "—",
          ])}
        />
      ) : tab === "participants" ? (
        <Table
          head={["Name", "Team", "Roll", "Dept", "Phone", "Pref", "Present", "Meal"]}
          rows={(filtered as unknown as NonNullable<typeof d>["participants"]).map((p) => [
            `${p.full_name}${p.is_leader ? " (lead)" : ""}`,
            `${p.team_name} · ${p.team_code}`,
            p.student_id,
            p.department,
            p.phone,
            foodLabel(p.food_pref),
            p.team_present ? "YES" : "—",
            p.meal_redeemed ? "YES" : "—",
          ])}
        />
      ) : tab === "registrations" ? (
        <Table
          head={["Code", "Team", "Size", "Status", "Expected", "Paid", "UTR", "Submitted"]}
          rows={(filtered as unknown as NonNullable<typeof d>["registrations"]).map((r) => [
            r.registration_code,
            `${r.team_name} · ${r.team_code}`,
            r.team_size,
            r.status,
            `₹${r.expected_amount}`,
            r.paid_amount ? `₹${r.paid_amount}` : "—",
            r.utr_number || "—",
            fmt(r.submitted_at),
          ])}
        />
      ) : (
        <Table
          head={
            tab === "present"
              ? ["Team", "Code", "Size", "Marked at", "By", "Tokens"]
              : ["Team", "Code", "Size", "Leader", "Phone", "Status"]
          }
          rows={(filtered as unknown as NonNullable<typeof d>["present"]).map((t) =>
            tab === "present"
              ? [
                  t.team_name,
                  t.registration_code,
                  t.team_size,
                  fmt(t.marked_at),
                  t.marked_by ?? "—",
                  `${t.tokens_redeemed}/${t.tokens_released}/${t.tokens_total}`,
                ]
              : [t.team_name, t.registration_code, t.team_size, t.leader_name, t.leader_phone, t.status],
          )}
        />
      )}

      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
        {filtered.length} rows · generated {fmt(d?.generated_at)}
      </p>
    </div>
  );
}
