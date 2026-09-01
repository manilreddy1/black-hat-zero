import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteRegistration,
  getMe,
  getRegistrationDetail,
  grantPaymentRetry,
  listRegistrations,
  releaseFoodTokens,
  resendLeadInvite,
  updateRegistrationTeam,
  verifyPayment,
} from "@/lib/staff.functions";
import { formatMoney, REJECTION_REASONS } from "@/lib/constants";
import { DEPARTMENT_OPTIONS, localPhone } from "@/lib/schemas";
import { StatusBadge } from "@/components/site/StatusBadge";
import { SpotRegistration } from "@/components/staff/SpotRegistration";

type EditMember = {
  id: string | null;
  full_name: string;
  email: string;
  phone: string;
  student_id: string;
  department: string;
  food_pref: "VEG" | "NON_VEG";
};


export const Route = createFileRoute("/_authenticated/c/$k/registrations")({
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
  const retryFn = useServerFn(grantPaymentRetry);
  const deleteFn = useServerFn(deleteRegistration);
  const meFn = useServerFn(getMe);
  const qc = useQueryClient();

  const me = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const isSuper = !!me.data?.roles.includes("super_admin");
  const isAdmin = isSuper || !!me.data?.roles.includes("admin");
  const isViewOnly =
    !isAdmin && !me.data?.roles.includes("payment_verifier") && !!me.data?.roles.includes("coordinator");



  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState(REJECTION_REASONS[0] ?? "");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<{ base64: string; type: string; name: string } | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<{ id: string; label: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState<{
    team_name: string;
    college: string;
    department: string;
    members: EditMember[];
  } | null>(null);
  const [tempPass, setTempPass] = useState<{
    email: string;
    password: string;
    emailed: boolean;
  } | null>(null);




  const list = useQuery({
    queryKey: ["registrations", status, search],
    queryFn: () => listFn({ data: { status, search } }),
  });

  const detail = useQuery({
    queryKey: ["registration", openId],
    queryFn: () => detailFn({ data: { id: openId! } }),
    enabled: !!openId,
  });

  const updateFn = useServerFn(updateRegistrationTeam);
  const releaseFn = useServerFn(releaseFoodTokens);
  const inviteFn = useServerFn(resendLeadInvite);

  const release = useMutation({
    mutationFn: (v: boolean) =>
      releaseFn({ data: { registration_id: openId!, all: false, release: v } }),
    onSuccess: (r) => {
      toast.success(`${r.tokens} food token(s) updated.`);
      qc.invalidateQueries({ queryKey: ["registration", openId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const releaseAll = useMutation({
    mutationFn: () => releaseFn({ data: { registration_id: null, all: true, release: true } }),
    onSuccess: (r) => {
      toast.success(`${r.tokens} food token(s) released across ${r.teams} team(s).`);
      qc.invalidateQueries({ queryKey: ["registration"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invite = useMutation({
    mutationFn: () => inviteFn({ data: { registration_id: openId! } }),
    onSuccess: (r: { email: string; tempPassword: string; emailed: boolean }) => {
      setTempPass({ email: r.email, password: r.tempPassword, emailed: r.emailed });
      toast.success(
        r.emailed
          ? `Email sent successfully to ${r.email}.`
          : "Temporary password issued — share it with the lead.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const d = detail.data;
  const regStatus = d?.registration.status ?? "";
  const paymentLocked = regStatus === "PAYMENT_APPROVED" || regStatus === "REGISTERED";
  const canEdit = isAdmin && (!paymentLocked || isSuper);

  useEffect(() => {
    setEditing(false);
    setEdit(null);
  }, [openId]);

  const startEdit = () => {
    if (!d) return;
    setEdit({
      team_name: d.team?.team_name ?? "",
      college: d.team?.college ?? "",
      department: d.team?.department ?? "",
      members: d.members.map((m) => ({
        id: m.id,
        full_name: m.full_name ?? "",
        email: m.email ?? "",
        phone: localPhone(m.phone ?? ""),
        student_id: m.student_id ?? "",
        department: m.department ?? d.team?.department ?? "",
        food_pref: (m.food_pref === "NON_VEG" ? "NON_VEG" : "VEG") as "VEG" | "NON_VEG",
      })),
    });
    setEditing(true);
  };

  const save = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          id: openId!,
          team_name: edit!.team_name,
          college: edit!.college,
          department: edit!.department,
          members: edit!.members.map((m) => ({ ...m, phone: `+91${m.phone}` })),
        },
      }),
    onSuccess: () => {
      toast.success("Team updated.");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["registrations"] });
      qc.invalidateQueries({ queryKey: ["registration", openId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setMember = (i: number, patch: Partial<EditMember>) =>
    setEdit((s) =>
      s ? { ...s, members: s.members.map((m, j) => (j === i ? { ...m, ...patch } : m)) } : s,
    );


  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Team deleted.");
      setPendingDelete(null);
      setOpenId(null);
      qc.invalidateQueries({ queryKey: ["registrations"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmDelete = (id: string, label: string) => setPendingDelete({ id, label });


  const decide = useMutation({
    mutationFn: (decision: "APPROVE" | "REJECT") =>
      verifyFn({
        data: {
          registration_id: openId!,
          decision,
          reason,
          notes,
          receipt: decision === "APPROVE" ? receipt : null,
        },
      }),
    onSuccess: () => {
      toast.success("Verification recorded.");
      setReceipt(null);
      qc.invalidateQueries({ queryKey: ["registrations"] });
      qc.invalidateQueries({ queryKey: ["registration", openId] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grantRetry = useMutation({
    mutationFn: () => retryFn({ data: { registration_id: openId!, note: notes } }),
    onSuccess: () => {
      toast.success("Team can submit payment again.");
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
        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <button
              disabled={releaseAll.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    "Send food tokens to every confirmed team? Participants will see their QR in the team portal.",
                  )
                )
                  releaseAll.mutate();
              }}
              className="clip-notch bg-primary px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
            >
              [ Send tokens to all teams ]
            </button>
          )}
          {!isViewOnly && (
            <button
              onClick={exportCsv}
              className="clip-notch border border-border px-4 py-2.5 font-mono text-[11px] tracking-[0.2em] uppercase hover:border-primary hover:text-primary"
            >
              [ Export CSV ]
            </button>
          )}

        </div>
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
                <td className="px-3 py-3 whitespace-nowrap">
                  <button
                    onClick={() => setOpenId(r.id)}
                    className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase"
                  >
                    View
                  </button>
                  {isAdmin && (
                    <button
                      disabled={remove.isPending}
                      onClick={() => confirmDelete(r.id, r.team_name || r.registration_code)}
                      className="ml-3 font-mono text-[11px] tracking-[0.2em] text-destructive uppercase disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
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
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[11px] tracking-[0.3em] text-primary">MEMBERS</p>
                    {isAdmin && !editing && (
                      <button
                        onClick={startEdit}
                        disabled={!canEdit}
                        title={
                          canEdit
                            ? "Edit team details"
                            : "Payment approved — only a super admin can edit"
                        }
                        className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase disabled:opacity-40"
                      >
                        [ Edit team ]
                      </button>
                    )}
                  </div>

                  {!editing && (
                    <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
                      {detail.data.members.map((m) => (
                        <li key={m.id}>
                          {String(m.member_index).padStart(2, "0")} · {m.full_name} · {m.email} ·{" "}
                          {m.phone} · {m.student_id ?? "—"} · {m.department ?? "—"} ·{" "}
                          {m.food_pref === "NON_VEG" ? "Non-veg" : "Veg"}
                        </li>
                      ))}
                    </ul>
                  )}

                  {editing && edit && (
                    <div className="mt-3 space-y-4">
                      {paymentLocked && (
                        <p className="font-mono text-[10px] tracking-[0.2em] text-destructive uppercase">
                          Payment already approved — super admin override
                        </p>
                      )}
                      <div className="grid gap-2">
                        <input
                          value={edit.team_name}
                          onChange={(e) => setEdit({ ...edit, team_name: e.target.value })}
                          placeholder="Team name"
                          className="border border-input bg-background px-3 py-2 font-mono text-xs"
                        />
                        <input
                          value={edit.college}
                          onChange={(e) => setEdit({ ...edit, college: e.target.value })}
                          placeholder="College"
                          className="border border-input bg-background px-3 py-2 font-mono text-xs"
                        />
                        <select
                          value={edit.department}
                          onChange={(e) => setEdit({ ...edit, department: e.target.value })}
                          className="border border-input bg-background px-3 py-2 font-mono text-xs"
                        >
                          <option value="">Department…</option>
                          {DEPARTMENT_OPTIONS.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </div>

                      {edit.members.map((m, i) => (
                        <div key={m.id ?? `new-${i}`} className="space-y-2 border border-border p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                              {i === 0 ? "Leader" : `Member ${i + 1}`}
                            </p>
                            {i > 0 && (
                              <button
                                onClick={() =>
                                  setEdit({
                                    ...edit,
                                    members: edit.members.filter((_, j) => j !== i),
                                  })
                                }
                                className="font-mono text-[10px] tracking-[0.2em] text-destructive uppercase"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <input
                            value={m.full_name}
                            onChange={(e) => setMember(i, { full_name: e.target.value })}
                            placeholder="Full name"
                            className="w-full border border-input bg-background px-3 py-2 font-mono text-xs"
                          />
                          <input
                            value={m.email}
                            onChange={(e) => setMember(i, { email: e.target.value })}
                            placeholder="Email"
                            className="w-full border border-input bg-background px-3 py-2 font-mono text-xs"
                          />
                          <div className="flex">
                            <span className="border border-r-0 border-input bg-surface px-3 py-2 font-mono text-xs text-muted-foreground">
                              +91
                            </span>
                            <input
                              value={m.phone}
                              inputMode="numeric"
                              maxLength={10}
                              onChange={(e) =>
                                setMember(i, { phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                              }
                              placeholder="10-digit mobile"
                              className="w-full border border-input bg-background px-3 py-2 font-mono text-xs"
                            />
                          </div>
                          <input
                            value={m.student_id}
                            onChange={(e) =>
                              setMember(i, { student_id: e.target.value.toUpperCase().slice(0, 10) })
                            }
                            placeholder="Roll number (2_X0_A62__)"
                            className="w-full border border-input bg-background px-3 py-2 font-mono text-xs"
                          />
                          <select
                            value={m.department}
                            onChange={(e) => setMember(i, { department: e.target.value })}
                            className="w-full border border-input bg-background px-3 py-2 font-mono text-xs"
                          >
                            <option value="">Department…</option>
                            {DEPARTMENT_OPTIONS.map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                          <select
                            value={m.food_pref}
                            onChange={(e) =>
                              setMember(i, { food_pref: e.target.value as "VEG" | "NON_VEG" })
                            }
                            className="w-full border border-input bg-background px-3 py-2 font-mono text-xs"
                          >
                            <option value="VEG">Veg</option>
                            <option value="NON_VEG">Non-veg</option>
                          </select>
                        </div>
                      ))}

                      <button
                        onClick={() =>
                          setEdit({
                            ...edit,
                            members: [
                              ...edit.members,
                              {
                                id: null,
                                full_name: "",
                                email: "",
                                phone: "",
                                student_id: "",
                                department: edit.department,
                                food_pref: "VEG",
                              },
                            ],
                          })
                        }
                        className="w-full border border-dashed border-border py-2 font-mono text-[11px] tracking-[0.2em] uppercase hover:border-primary hover:text-primary"
                      >
                        + Add member
                      </button>

                      <div className="flex gap-3">
                        <button
                          disabled={save.isPending}
                          onClick={() => setEditing(false)}
                          className="clip-notch flex-1 border border-border py-3 font-mono text-[11px] font-bold tracking-[0.2em] uppercase disabled:opacity-60"
                        >
                          [ Cancel ]
                        </button>
                        <button
                          disabled={save.isPending}
                          onClick={() => save.mutate()}
                          className="clip-notch flex-1 bg-primary py-3 font-mono text-[11px] font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
                        >
                          {save.isPending ? "[ Saving… ]" : "[ Save changes ]"}
                        </button>
                      </div>
                    </div>
                  )}
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
                  {detail.data.receipt_url && (
                    <>
                      <p className="mt-4 font-mono text-[11px] tracking-[0.3em] text-primary">
                        PAYMENT RECEIVED PROOF
                      </p>
                      <a href={detail.data.receipt_url} target="_blank" rel="noreferrer">
                        <img
                          src={detail.data.receipt_url}
                          alt="Payment received proof"
                          className="mt-2 max-h-72 border border-border"
                        />
                      </a>
                    </>
                  )}
                </div>

                {["REGISTERED", "PAYMENT_APPROVED"].includes(
                  detail.data.registration.status,
                ) && (
                  <div className="border-t border-border pt-4">
                    <p className="font-mono text-[11px] tracking-[0.3em] text-primary">
                      EVENT ACCESS
                    </p>
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      Attendance:{" "}
                      {detail.data.attendance
                        ? `PRESENT · ${new Date(detail.data.attendance.marked_at).toLocaleString()}`
                        : "NOT MARKED"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      Food tokens: {detail.data.foodTokens.filter((t) => t.released).length}/
                      {detail.data.foodTokens.length} released ·{" "}
                      {detail.data.foodTokens.filter((t) => t.redeemed_at).length} redeemed
                    </p>
                    {isAdmin && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          disabled={release.isPending}
                          onClick={() => release.mutate(true)}
                          className="clip-notch bg-primary px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
                        >
                          [ Send food tokens ]
                        </button>
                        <button
                          disabled={release.isPending}
                          onClick={() => release.mutate(false)}
                          className="clip-notch border border-border px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.2em] uppercase disabled:opacity-60"
                        >
                          [ Withdraw ]
                        </button>
                        <button
                          disabled={invite.isPending}
                          onClick={() => invite.mutate()}
                          className="clip-notch border border-border px-4 py-2.5 font-mono text-[11px] font-bold tracking-[0.2em] uppercase disabled:opacity-60"
                        >
                          [ Issue new lead password ]
                        </button>
                      </div>
                    )}
                    {isAdmin && tempPass && (
                      <div
                        className={`mt-3 border p-3 ${
                          tempPass.emailed
                            ? "border-primary/50 bg-primary/10"
                            : "border-destructive/50 bg-destructive/10"
                        }`}
                      >
                        <p className="font-mono text-[10px] tracking-[0.3em] text-primary">
                          {tempPass.emailed ? "EMAIL SENT SUCCESSFULLY" : "EMAIL DELIVERY FAILED"} — {tempPass.email}
                        </p>
                        <p className="mt-2 font-mono text-lg break-all">{tempPass.password}</p>
                        <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                          {tempPass.emailed
                            ? "The temporary password was accepted for delivery to the team lead. They must set their own password on first sign-in."
                            : "The email could not be delivered — share this password with the lead directly. They must set their own password on first sign-in."}
                        </p>
                      </div>
                    )}

                  </div>
                )}

                {!isViewOnly && detail.data.registration.status === "PAYMENT_REJECTED" && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="font-mono text-[11px] tracking-[0.3em] text-destructive">
                      REJECTED — ANOTHER CHANCE
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      The team sees the rejection reason and can request another chance. Granting it
                      re-opens their payment form.
                    </p>
                    <button
                      disabled={grantRetry.isPending}
                      onClick={() => grantRetry.mutate()}
                      className="clip-notch w-full border border-primary py-3 font-mono text-[11px] font-bold tracking-[0.2em] text-primary uppercase disabled:opacity-60"
                    >
                      [ Grant another chance ]
                    </button>
                  </div>
                )}

                {!isViewOnly && detail.data.registration.status === "PAYMENT_REVIEW" && (
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
                    <div className="space-y-2">
                      <p className="font-mono text-[10px] tracking-[0.2em] text-destructive uppercase">
                        Payment received proof (required to approve) · PNG/JPG/WEBP · max 5 MB
                      </p>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return setReceipt(null);
                          if (f.size > 5 * 1024 * 1024) {
                            toast.error("Proof must be under 5 MB.");
                            e.target.value = "";
                            return setReceipt(null);
                          }
                          const fr = new FileReader();
                          fr.onload = () =>
                            setReceipt({
                              base64: String(fr.result),
                              type: f.type,
                              name: f.name,
                            });
                          fr.readAsDataURL(f);
                        }}
                        className="w-full border-2 border-destructive bg-destructive/10 px-3 py-2.5 font-mono text-xs text-destructive file:mr-3 file:rounded-sm file:border-0 file:bg-destructive file:px-3 file:py-1 file:font-mono file:text-[11px] file:font-bold file:text-destructive-foreground hover:bg-destructive/15"
                      />
                      {receipt && (
                        <img
                          src={receipt.base64}
                          alt="Selected payment received proof"
                          className="max-h-40 border border-border"
                        />
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        disabled={decide.isPending || !receipt}
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

                {isAdmin && (
                  <div className="border-t border-border pt-4">
                    <p className="font-mono text-[11px] tracking-[0.3em] text-destructive">
                      DANGER ZONE
                    </p>
                    <button
                      disabled={remove.isPending}
                      onClick={() =>
                        confirmDelete(
                          detail.data!.registration.id,
                          detail.data!.team?.team_name ?? detail.data!.registration.registration_code,
                        )
                      }
                      className="clip-notch mt-3 w-full border border-destructive py-3 font-mono text-[11px] font-bold tracking-[0.2em] text-destructive uppercase disabled:opacity-60"
                    >
                      [ Delete team permanently ]
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
          onClick={() => !remove.isPending && setPendingDelete(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="panel clip-notch w-full max-w-md border border-destructive/60 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-[11px] tracking-[0.4em] text-destructive">
              // CONFIRM DELETE
            </p>
            <h2 className="mt-3 font-display text-xl font-bold tracking-widest uppercase">
              Delete {pendingDelete.label}?
            </h2>
            <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
              This permanently removes the team, its members, payment records and proof files. This
              action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                disabled={remove.isPending}
                onClick={() => setPendingDelete(null)}
                className="clip-notch flex-1 border border-border py-3 font-mono text-[11px] font-bold tracking-[0.2em] uppercase hover:border-primary hover:text-primary disabled:opacity-60"
              >
                [ Cancel ]
              </button>
              <button
                disabled={remove.isPending}
                onClick={() => remove.mutate(pendingDelete.id)}
                className="clip-notch flex-1 bg-destructive py-3 font-mono text-[11px] font-bold tracking-[0.2em] text-destructive-foreground uppercase disabled:opacity-60"
              >
                {remove.isPending ? "[ Deleting… ]" : "[ Delete ]"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
