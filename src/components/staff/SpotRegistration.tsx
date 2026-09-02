import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { createSpotRegistration, getSpotPaymentSettings } from "@/lib/staff.functions";
import { DEPARTMENT_OPTIONS } from "@/lib/schemas";
import { buildUpiUri, formatMoney } from "@/lib/constants";
import upiLogo from "@/assets/upi-logo.png.asset.json";

type Member = {
  full_name: string;
  email: string;
  phone: string;
  student_id: string;
  department: string;
  food_pref: "VEG" | "NON_VEG";
};

const emptyMember = (department: string): Member => ({
  full_name: "",
  email: "",
  phone: "",
  student_id: "",
  department,
  food_pref: "VEG",
});

const input =
  "w-full border border-input bg-surface px-3 py-2.5 font-mono text-xs focus:border-primary focus:outline-none";
const label = "font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase";

/** Walk-in team registration at the venue. Super admin only. */
export function SpotRegistration({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const createFn = useServerFn(createSpotRegistration);
  const settingsFn = useServerFn(getSpotPaymentSettings);
  const { data: pay } = useQuery({ queryKey: ["spot-pay-settings"], queryFn: () => settingsFn({}) });

  const defaultDept = DEPARTMENT_OPTIONS[0] ?? "";
  const [teamName, setTeamName] = useState("");
  const [college, setCollege] = useState("Narsimha Reddy Engineering College");
  const [department, setDepartment] = useState(defaultDept);
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CASH">("UPI");
  const [utr, setUtr] = useState("");
  const [note, setNote] = useState("");
  const [members, setMembers] = useState<Member[]>([
    emptyMember(defaultDept),
    emptyMember(defaultDept),
  ]);

  const setMember = (i: number, patch: Partial<Member>) =>
    setMembers((s) => s.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  const amount = (pay?.registration_fee ?? 0) * members.length;
  const upiUri = useMemo(
    () =>
      pay?.upi_id && amount > 0
        ? buildUpiUri({
            upiId: pay.upi_id,
            payeeName: pay.upi_payee_name,
            amount,
            note: teamName.trim() || "SPOT REGISTRATION",
          })
        : "",
    [pay, amount, teamName],
  );

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          team_name: teamName,
          college,
          department,
          payment_mode: paymentMode,
          utr_number: paymentMode === "UPI" ? utr : undefined,
          note,
          members: members.map((m) => ({ ...m, phone: `+91${m.phone}` })),
        },
      }),
    onSuccess: (r: { registration_code: string; team_code: string; status: string }) => {
      toast.success(`Team created — ${r.registration_code} (${r.team_code}) · ${r.status}`);
      qc.invalidateQueries({ queryKey: ["registrations"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const valid =
    teamName.trim().length >= 2 &&
    college.trim().length >= 2 &&
    (paymentMode === "CASH" || /^\d{12}$/.test(utr)) &&
    members.every(
      (m) =>
        m.full_name.trim().length >= 2 &&
        /\S+@\S+\.\S+/.test(m.email) &&
        /^[6-9]\d{9}$/.test(m.phone) &&
        m.student_id.trim().length === 10,
    );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur-sm"
      onClick={() => !create.isPending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="panel clip-notch my-8 w-full max-w-3xl border border-primary/50 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// SPOT REGISTRATION</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-widest uppercase">
          New on-spot team
        </h2>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          Bypasses the public registration window. Super admin only.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <p className={label}>Team name</p>
            <input className={input} value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </div>
          <div>
            <p className={label}>College</p>
            <input className={input} value={college} onChange={(e) => setCollege(e.target.value)} />
          </div>
          <div>
            <p className={label}>Department</p>
            <select
              className={input}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {DEPARTMENT_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {members.map((m, i) => (
            <div key={i} className="border border-border/70 p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] tracking-[0.3em] text-primary">
                  {i === 0 ? "TEAM LEAD" : `MEMBER ${i + 1}`}
                </p>
                {i > 0 && (
                  <button
                    onClick={() => setMembers((s) => s.filter((_, j) => j !== i))}
                    className="font-mono text-[10px] tracking-[0.2em] text-destructive uppercase"
                  >
                    [ Remove ]
                  </button>
                )}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className={label}>Full name</p>
                  <input
                    className={input}
                    value={m.full_name}
                    onChange={(e) => setMember(i, { full_name: e.target.value })}
                  />
                </div>
                <div>
                  <p className={label}>Email</p>
                  <input
                    className={input}
                    value={m.email}
                    onChange={(e) => setMember(i, { email: e.target.value })}
                  />
                </div>
                <div>
                  <p className={label}>Phone (+91)</p>
                  <input
                    className={input}
                    inputMode="numeric"
                    maxLength={10}
                    value={m.phone}
                    onChange={(e) =>
                      setMember(i, { phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                    }
                  />
                </div>
                <div>
                  <p className={label}>Roll no (2_X0_A62__)</p>
                  <input
                    className={input}
                    maxLength={10}
                    value={m.student_id}
                    onChange={(e) =>
                      setMember(i, {
                        student_id: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10),
                      })
                    }
                  />
                </div>
                <div>
                  <p className={label}>Department</p>
                  <select
                    className={input}
                    value={m.department}
                    onChange={(e) => setMember(i, { department: e.target.value })}
                  >
                    {DEPARTMENT_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className={label}>Food preference</p>
                  <select
                    className={input}
                    value={m.food_pref}
                    onChange={(e) =>
                      setMember(i, { food_pref: e.target.value as "VEG" | "NON_VEG" })
                    }
                  >
                    <option value="VEG">Veg</option>
                    <option value="NON_VEG">Non-veg</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          {members.length < 5 && (
            <button
              onClick={() => setMembers((s) => [...s, emptyMember(department)])}
              className="clip-notch border border-border px-4 py-2.5 font-mono text-[11px] tracking-[0.2em] uppercase hover:border-primary hover:text-primary"
            >
              [ Add member ]
            </button>
          )}
        </div>

        <div className="mt-6 border border-border/70 p-4">
          <p className="font-mono text-[11px] tracking-[0.3em] text-primary">PAYMENT</p>
          <div className="mt-3 flex gap-3">
            {(["UPI", "CASH"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMode(m)}
                className={`clip-notch border px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase ${
                  paymentMode === m
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary"
                }`}
              >
                {m === "UPI" ? "[ UPI / QR ]" : "[ Cash on spot ]"}
              </button>
            ))}
          </div>

          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
            Amount due: <span className="text-foreground">{formatMoney(amount, pay?.currency)}</span>{" "}
            ({members.length} × {formatMoney(pay?.registration_fee ?? 0, pay?.currency)})
          </p>

          {paymentMode === "UPI" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
              <div className="relative w-[180px] bg-white p-3">
                {upiUri ? (
                  <>
                    <QRCode value={upiUri} size={160} level="H" className="block h-auto w-full" />
                    <span className="absolute inset-0 m-auto flex h-9 w-9 items-center justify-center bg-white p-1">
                      <img src={upiLogo.url} alt="UPI" className="block h-auto w-full object-contain" />
                    </span>
                  </>
                ) : (
                  <p className="font-mono text-[10px] text-black">UPI ID not configured</p>
                )}
              </div>
              <div>
                <p className="font-mono text-[10px] text-muted-foreground">
                  UPI ID: <span className="text-foreground">{pay?.upi_id || "—"}</span>
                </p>
                <div className="mt-3">
                  <p className={label}>UTR / reference (12 digits)</p>
                  <input
                    className={input}
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="123456789012"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 font-mono text-[11px] text-muted-foreground">
              Cash collected at the desk — no UTR required.
            </p>
          )}

          <div className="mt-4">
            <p className={label}>Note (optional)</p>
            <input className={input} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>


        <div className="mt-6 flex gap-3">
          <button
            disabled={create.isPending}
            onClick={onClose}
            className="clip-notch flex-1 border border-border py-3 font-mono text-[11px] font-bold tracking-[0.2em] uppercase hover:border-primary hover:text-primary disabled:opacity-60"
          >
            [ Cancel ]
          </button>
          <button
            disabled={!valid || create.isPending}
            onClick={() => create.mutate()}
            className="clip-notch flex-1 bg-primary py-3 font-mono text-[11px] font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
          >
            {create.isPending ? "[ Creating… ]" : "[ Create team ]"}
          </button>
        </div>
      </div>
    </div>
  );
}
