import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteRegistration,
  getMe,
  getRegistrationDetail,
  listRegistrations,
  verifyPayment,
} from "@/lib/staff.functions";
import { formatMoney, REJECTION_REASONS } from "@/lib/constants";
import { StatusBadge } from "@/components/site/StatusBadge";

export const Route = createFileRoute("/_authenticated/dashboard/registrations")({
  component: RegistrationsPage,
});

const STATUSES = [
  "ALL",
  "PAYMENT_PENDING",
  "PAYMENT_REVIEW",
  "PAYMENT_APPROVED",
  "REGISTERED",
  "PAYMENT_REJECTED",
  "CANCELLED",
];

function RegistrationsPage() {
  const listFn = useServerFn(listRegistrations);
  const detailFn = useServerFn(getRegistrationDetail);
  const verifyFn = useServerFn(verifyPayment);
  const deleteFn = useServerFn(deleteRegistration);
  const meFn = useServerFn(getMe);
  const qc = useQueryClient();

  const me = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const isAdmin = !!me.data?.roles.includes("admin");


  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState(REJECTION_REASONS[0] ?? "");
  const [notes, setNotes] = useState("");

  const list = useQuery({
    queryKey: ["registrations", status, search],
    queryFn: () => listFn({ data: { status, search } }),
  });

  const detail = useQuery({
    queryKey: ["registration", openId],
    queryFn: () => detailFn({ data: { id: openId! } }),
    enabled: !!openId,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Team deleted.");
      setOpenId(null);
      qc.invalidateQueries({ queryKey: ["registrations"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmDelete = (id: string, label: string) => {
    if (
      window.confirm(
        `Delete ${label}? This permanently removes the team, its members, payment records and proof files.`,
      )
    )
      remove.mutate(id);
  };

  const decide = useMutation({
    mutationFn: (decision: "APPROVE" | "REJECT") =>
      verifyFn({ data: { registration_id: openId!, decision, reason, notes } }),
    onSuccess: () => {
      toast.success("Verification recorded.");
      qc.invalidateQueries({ queryKey: ["registrations"] });
      qc.invalidateQueries({ queryKey: ["registration", openId] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportCsv = () => {
    const rows = list.data ?? [];
    const head = [
      "registration_code",
      "team_name",
      "leader_name",
      "leader_email",
      "leader_phone",
      "college",
      "team_size",
      "expected_amount",
      "status",
      "utr_number",
    ];
    const csv = [
      head.join(","),
      ...rows.map((r) =>
        head.map((k) => `"${String((r as never)[k] ?? "").replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "blackhat0-registrations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// REGISTRATIONS</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-widest uppercase">Teams</h1>
        </div>
        <button
          onClick={exportCsv}
          className="clip-notch border border-border px-4 py-2.5 font-mono text-[11px] tracking-[0.2em] uppercase hover:border-primary hover:text-primary"
        >
          [ Export CSV ]
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-input bg-surface px-3 py-2.5 font-mono text-xs"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search code, team, email, UTR…"
          className="min-w-56 flex-1 border border-input bg-surface px-3 py-2.5 font-mono text-xs"
        />
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
            <tr>
              {["CODE", "TEAM", "LEADER", "COLLEGE", "SIZE", "AMOUNT", "UTR", "STATUS", ""].map(
                (h) => (
                  <th key={h} className="px-3 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((r) => (
              <tr key={r.id} className="border-b border-border/60 hover:bg-primary/5">
                <td className="px-3 py-3 font-mono text-xs whitespace-nowrap">
                  {r.registration_code}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">{r.team_name}</td>
                <td className="px-3 py-3 text-xs whitespace-nowrap">
                  {r.leader_name}
                  <br />
                  <span className="text-muted-foreground">{r.leader_email}</span>
                </td>
                <td className="px-3 py-3 text-xs">{r.college}</td>
                <td className="px-3 py-3">{r.team_size}</td>
                <td className="px-3 py-3 whitespace-nowrap">{formatMoney(r.expected_amount)}</td>
                <td className="px-3 py-3 font-mono text-xs">{r.utr_number ?? "—"}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => setOpenId(r.id)}
                    className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.data?.length === 0 && (
          <p className="p-6 font-mono text-xs text-muted-foreground">NO RECORDS MATCH.</p>
        )}
      </div>

      {openId && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm"
          onClick={() => setOpenId(null)}
        >
          <div
            className="h-full w-full max-w-xl overflow-y-auto border-l border-border bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpenId(null)}
              className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase"
            >
              [ Close ]
            </button>
            {detail.data && (
              <div className="mt-5 space-y-5">
                <div>
                  <p className="font-display text-2xl font-bold tracking-widest uppercase">
                    {detail.data.team?.team_name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {detail.data.registration.registration_code} · {detail.data.team?.team_code}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={detail.data.registration.status} />
                  </div>
                </div>

                <div>
                  <p className="font-mono text-[11px] tracking-[0.3em] text-primary">MEMBERS</p>
                  <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
                    {detail.data.members.map((m) => (
                      <li key={m.id}>
                        {String(m.member_index).padStart(2, "0")} · {m.full_name} · {m.email} ·{" "}
                        {m.phone}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-mono text-[11px] tracking-[0.3em] text-primary">PAYMENT</p>
                  <p className="mt-2 font-mono text-xs">
                    UTR: {detail.data.payment?.utr_number ?? "—"} ·{" "}
                    {formatMoney(detail.data.registration.expected_amount)} ·{" "}
                    {detail.data.payment?.status ?? "NOT SUBMITTED"}
                  </p>
                  {detail.data.screenshot_url && (
                    <a href={detail.data.screenshot_url} target="_blank" rel="noreferrer">
                      <img
                        src={detail.data.screenshot_url}
                        alt="Payment proof screenshot"
                        className="mt-3 max-h-72 border border-border"
                      />
                    </a>
                  )}
                </div>

                {detail.data.registration.status === "PAYMENT_REVIEW" && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="font-mono text-[11px] tracking-[0.3em] text-primary">VERIFY</p>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full border border-input bg-background px-3 py-2.5 font-mono text-xs"
                    >
                      {REJECTION_REASONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Internal notes (optional)"
                      rows={3}
                      className="w-full border border-input bg-background px-3 py-2.5 font-mono text-xs"
                    />
                    <div className="flex gap-3">
                      <button
                        disabled={decide.isPending}
                        onClick={() => decide.mutate("APPROVE")}
                        className="clip-notch flex-1 bg-primary py-3 font-mono text-[11px] font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
                      >
                        [ Approve ]
                      </button>
                      <button
                        disabled={decide.isPending}
                        onClick={() => decide.mutate("REJECT")}
                        className="clip-notch flex-1 border border-destructive py-3 font-mono text-[11px] font-bold tracking-[0.2em] text-destructive uppercase disabled:opacity-60"
                      >
                        [ Reject ]
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <p className="font-mono text-[11px] tracking-[0.3em] text-primary">HISTORY</p>
                  <ul className="mt-2 space-y-1 font-mono text-[11px] text-muted-foreground">
                    {detail.data.history.map((h) => (
                      <li key={h.id}>
                        {new Date(h.created_at).toLocaleString()} — {h.from_status} → {h.to_status}
                        {h.note ? ` (${h.note})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
