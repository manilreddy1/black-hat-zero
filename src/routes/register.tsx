import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { siteContentQuery, useT } from "@/hooks/useSiteContent";
import { createRegistration } from "@/lib/public.functions";
import { formatMoney } from "@/lib/constants";
import {
  clean,
  cleanEmail,
  cleanPhone,
  cleanRoll,
  localPhone,
  yearFromDepartment,
  ROLL_RE,
  FIELD_LIMITS,
  DEPARTMENT_OPTIONS,
} from "@/lib/schemas";

import { GlitchText } from "@/components/site/GlitchText";
import { CyberBackground } from "@/components/site/CyberBackground";

export const Route = createFileRoute("/register")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: () => ({
    meta: [
      { title: "Register Your Team — BLACK HAT#0 '26" },
      {
        name: "description",
        content:
          "Register a team of up to 4 for BLACK HAT ZERO '26. Fill team details, pay by UPI and submit your UTR for verification.",
      },
      { property: "og:title", content: "Register Your Team — BLACK HAT#0 '26" },
      {
        property: "og:description",
        content: "Lock your slot at BLACK HAT ZERO '26 — teams of up to 4, verified UPI payment.",
      },
    ],
  }),
  component: RegisterPage,
});

type Member = {
  full_name: string;
  email: string;
  phone: string;
  student_id: string;
  department: string;
  year: string;
};

const emptyMember = (): Member => ({
  full_name: "",
  email: "",
  phone: "",
  student_id: "",
  department: "",
  year: "",
});

const field =
  "w-full border border-input bg-surface px-3 py-3 font-mono text-sm outline-none transition-shadow focus:border-primary focus:shadow-[var(--glow-red)]";
const labelCls = "font-mono text-[11px] tracking-[0.25em] text-muted-foreground";

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  placeholder,
  maxLength = 120,
  inputMode,
  autoComplete = "off",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  inputMode?: "text" | "email" | "tel" | "numeric";
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>
        {label}
        <span className="ml-2 opacity-50">{value.length}/{maxLength}</span>
      </span>
      <input
        type={type}
        required={required}
        value={value}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        spellCheck={false}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        onBlur={(e) => onChange(clean(e.target.value).slice(0, maxLength))}
        className={`mt-2 ${field}`}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  optional = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <select
        value={value}
        required={!optional}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 ${field}`}
      >
        <option value="">{optional ? "— none —" : "— select —"}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function PhoneField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const digits = localPhone(value);
  return (
    <label className="block">
      <span className={labelCls}>
        {label}
        <span className="ml-2 opacity-50">{digits.length}/10</span>
      </span>
      <div className="mt-2 flex">
        <span className="flex items-center border border-r-0 border-input bg-muted/30 px-3 font-mono text-sm text-muted-foreground">
          +91
        </span>
        <input
          type="tel"
          required
          value={digits}
          maxLength={10}
          inputMode="numeric"
          autoComplete="tel-national"
          spellCheck={false}
          placeholder="9876543210"
          onChange={(e) => onChange("+91" + e.target.value.replace(/\D/g, "").slice(0, 10))}
          className={field}
        />
      </div>
    </label>
  );
}

/** Fixed value shown as read-only (no user edits). */
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className={labelCls}>
        {label}
        <span className="ml-2 opacity-50">FIXED</span>
      </span>
      <div
        className={`mt-2 ${field} cursor-not-allowed bg-muted/30 text-muted-foreground`}
        aria-readonly="true"
      >
        {value || "—"}
      </div>
    </label>
  );
}

/** Roll number mask 2_X0_A62__ — only the underscore slots accept input. */
function RollField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const v = cleanRoll(value);
  const full = v.length === 10 ? v : "";
  const a = full ? full[1]! : "";
  const b = full ? full[4]! : "";
  const c = full ? full.slice(8) : "";
  const [parts, setParts] = useState<[string, string, string]>([a, b, c]);
  const push = (next: [string, string, string]) => {
    setParts(next);
    const composed = `2${next[0]}X0${next[1]}A62${next[2]}`;
    onChange(next[0] && next[1] && next[2].length === 2 ? composed : "");
  };
  const slot =
    "w-10 border border-input bg-surface px-0 py-3 text-center font-mono text-sm uppercase outline-none focus:border-primary focus:shadow-[var(--glow-red)]";
  const fixed = "px-1 font-mono text-sm text-muted-foreground";
  return (
    <label className="block">
      <span className={labelCls}>
        {label}
        <span className="ml-2 opacity-50">2_X0_A62__</span>
      </span>
      <div className="mt-2 flex items-center gap-1">
        <span className={fixed}>2</span>
        <input
          className={slot}
          value={parts[0]}
          inputMode="numeric"
          maxLength={1}
          placeholder="_"
          onChange={(e) =>
            push([e.target.value.replace(/\D/g, "").slice(0, 1), parts[1], parts[2]])
          }
        />
        <span className={fixed}>X0</span>
        <input
          className={slot}
          value={parts[1]}
          inputMode="numeric"
          maxLength={1}
          placeholder="_"
          onChange={(e) =>
            push([parts[0], e.target.value.replace(/\D/g, "").slice(0, 1), parts[2]])
          }
        />
        <span className={fixed}>A62</span>
        <input
          className={`${slot} w-14`}
          value={parts[2]}
          maxLength={2}
          placeholder="__"
          onChange={(e) =>
            push([
              parts[0],
              parts[1],
              e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 2),
            ])
          }
        />
      </div>
    </label>
  );
}


function RegisterPage() {
  const t = useT();
  const { data } = useSuspenseQuery(siteContentQuery);
  const settings = data.settings;
  const navigate = useNavigate();
  const submit = useServerFn(createRegistration);

  const min = settings?.min_team_size ?? 1;
  const max = settings?.max_team_size ?? 4;
  const fee = settings?.registration_fee ?? 350;
  const currency = settings?.currency ?? "INR";

  const [step, setStep] = useState(0);
  const [teamSize, setTeamSize] = useState(min);
  const [team, setTeam] = useState({
    team_name: "",
    leader_name: "",
    leader_email: "",
    leader_phone: "",
    college: settings?.college ?? "",
    department: "",
    year: "",
  });

  const [members, setMembers] = useState<Member[]>(() =>
    Array.from({ length: max }, () => emptyMember()),
  );

  const total = useMemo(() => fee * teamSize, [fee, teamSize]);
  const coMemberCount = Math.max(0, teamSize - 1);
  const leaderMember: Member = {
    ...emptyMember(),
    full_name: team.leader_name,
    email: team.leader_email,
    phone: team.leader_phone,
    department: team.department,
    year: team.year,
  };
  const deadlinePassed =
    !!settings && new Date(settings.registration_deadline).getTime() < Date.now();
  const closed = !settings?.registration_open || deadlinePassed;


  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          ...team,
          team_size: teamSize,
          members: [leaderMember, ...members.slice(0, coMemberCount)],
        },
      }),
    onSuccess: (res) => {
      toast.success(`Registration ${res.registration_code} created.`);
      navigate({ to: "/payment/$id", params: { id: res.registration_id } });
    },
    onError: (e: Error) => toast.error(e.message || "Registration failed."),
  });

  const setMember = (i: number, patch: Partial<Member>) =>
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

  const steps = ["TEAM", "MEMBERS", "CONFIRM"];

  const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(cleanEmail(v));
  const validPhone = (v: string) => /^\+91[6-9]\d{9}$/.test(cleanPhone(v));

  const memberIssues = (m: Member, i: number): string[] => {
    const out: string[] = [];
    if (clean(m.full_name).length < 2) out.push("Enter the member's full name");
    if (!validEmail(m.email)) out.push("Enter a valid email address");
    if (!validPhone(m.phone)) out.push("Enter a valid 10-digit mobile number (starts 6-9)");
    const others = [
      { email: cleanEmail(team.leader_email), phone: cleanPhone(team.leader_phone) },
      ...members.slice(0, coMemberCount).filter((_, idx) => idx !== i),
    ];
    if (validEmail(m.email) && others.some((o) => cleanEmail(o.email) === cleanEmail(m.email)))
      out.push("This email is already used by another member");
    if (validPhone(m.phone) && others.some((o) => cleanPhone(o.phone) === cleanPhone(m.phone)))
      out.push("This phone number is already used by another member");
    return out;
  };

  const stepValid = () => {
    if (step === 0)
      return Boolean(
        clean(team.team_name).length >= 2 &&
          clean(team.leader_name).length >= 2 &&
          validEmail(team.leader_email) &&
          validPhone(team.leader_phone) &&
          clean(team.college).length >= 2 &&
          DEPARTMENT_OPTIONS.includes(clean(team.department)),
      );
    if (step === 1) {
      const list = members.slice(0, coMemberCount);
      const emails = [cleanEmail(team.leader_email), ...list.map((m) => cleanEmail(m.email))];
      const phones = [cleanPhone(team.leader_phone), ...list.map((m) => cleanPhone(m.phone))];
      return (
        list.every(
          (m) => clean(m.full_name).length >= 2 && validEmail(m.email) && validPhone(m.phone),
        ) &&
        new Set(emails).size === emails.length &&
        new Set(phones).size === phones.length
      );
    }
    return true;
  };


  if (closed) {
    return (
      <div className="scanlines relative flex min-h-[80svh] items-center justify-center px-6 pt-24">
        <CyberBackground />
        <div className="panel clip-notch relative max-w-lg p-10 text-center">
          <h1 className="font-display text-3xl font-bold tracking-widest uppercase">
            {deadlinePassed
              ? t("register.deadline_title", "Registration deadline has passed")
              : t("register.closed_title", "Registrations are closed")}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {deadlinePassed
              ? t(
                  "register.deadline_message",
                  "The registration window for this edition has ended. Follow our channels for the next drop.",
                )
              : t(
                  "register.closed_message",
                  "Team registration for this edition is currently closed. Follow our channels for the next drop.",
                )}
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="scanlines relative min-h-screen px-6 pt-28 pb-20">
      <div className="grid-bg absolute inset-0 opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-4xl">
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// SECURE ENROLMENT</p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.5rem)] leading-none font-bold tracking-tight uppercase">
          <GlitchText text={t("register.title", "Register your team")} />
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {t("register.subtitle", "")}
        </p>

        <div className="mt-8 flex items-center gap-2 font-mono text-[11px] tracking-[0.25em]">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`px-3 py-1.5 ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                      ? "border border-primary/60 text-primary"
                      : "border border-border text-muted-foreground"
                }`}
              >
                {String(i + 1).padStart(2, "0")} {s}
              </span>
              {i < steps.length - 1 && <span className="h-px w-6 bg-border" />}
            </div>
          ))}
        </div>

        <div className="panel clip-notch mt-8 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="TEAM NAME"
                      maxLength={FIELD_LIMITS.team_name}
                      value={team.team_name}
                      onChange={(v) => setTeam({ ...team, team_name: v })}
                    />
                    <label className="block">
                      <span className={labelCls}>TEAM SIZE</span>
                      <select
                        value={teamSize}
                        onChange={(e) => setTeamSize(Number(e.target.value))}
                        className={`mt-2 ${field}`}
                      >
                        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? "member" : "members"} — {formatMoney(fee * n, currency)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Field
                      label="LEADER NAME"
                      maxLength={FIELD_LIMITS.name}
                      autoComplete="name"
                      value={team.leader_name}
                      onChange={(v) => setTeam({ ...team, leader_name: v })}
                    />
                    <Field
                      label="LEADER EMAIL"
                      type="email"
                      maxLength={FIELD_LIMITS.email}
                      inputMode="email"
                      autoComplete="email"
                      value={team.leader_email}
                      onChange={(v) => setTeam({ ...team, leader_email: v })}
                    />
                    <PhoneField
                      label="LEADER PHONE"
                      value={team.leader_phone}
                      onChange={(v) => setTeam({ ...team, leader_phone: v })}
                    />
                    <Field
                      label="COLLEGE"
                      maxLength={FIELD_LIMITS.college}
                      value={team.college}
                      onChange={(v) => setTeam({ ...team, college: v })}
                    />
                    <SelectField
                      label="DEPARTMENT & YEAR"
                      value={team.department}
                      options={DEPARTMENT_OPTIONS}
                      onChange={(v) =>
                        setTeam({ ...team, department: v, year: yearFromDepartment(v) })
                      }
                    />

                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-8">
                  <div className="border-l-2 border-l-primary/70 pl-5">
                    <p className="font-mono text-[11px] tracking-[0.3em] text-primary">
                      MEMBER 01 — TEAM LEADER
                    </p>
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      {team.leader_name} · {team.leader_email} · {localPhone(team.leader_phone)}
                    </p>
                    <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
                      ALREADY CAPTURED IN STEP 01
                    </p>
                  </div>
                  {coMemberCount === 0 ? (
                    <p className="font-mono text-xs text-muted-foreground">
                      SOLO ENTRY — NO ADDITIONAL MEMBERS REQUIRED.
                    </p>
                  ) : (
                    members.slice(0, coMemberCount).map((m, i) => {
                      const issues = memberIssues(m, i);
                      return (
                      <div key={i} className="border-l-2 border-l-primary/70 pl-5">
                        <p className="font-mono text-[11px] tracking-[0.3em] text-primary">
                          MEMBER {String(i + 2).padStart(2, "0")}
                        </p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <Field
                            label="FULL NAME"
                            maxLength={FIELD_LIMITS.name}
                            value={m.full_name}
                            onChange={(v) => setMember(i, { full_name: v })}
                          />
                          <Field
                            label="EMAIL"
                            type="email"
                            maxLength={FIELD_LIMITS.email}
                            inputMode="email"
                            value={m.email}
                            onChange={(v) => setMember(i, { email: v })}
                          />
                          <PhoneField
                            label="PHONE"
                            value={m.phone}
                            onChange={(v) => setMember(i, { phone: v })}
                          />
                          <Field
                            label="STUDENT ID (OPTIONAL)"
                            maxLength={FIELD_LIMITS.student_id}
                            required={false}
                            value={m.student_id}
                            onChange={(v) => setMember(i, { student_id: v })}
                          />
                          <SelectField
                            label="DEPARTMENT & YEAR (OPTIONAL)"
                            value={m.department}
                            options={DEPARTMENT_OPTIONS}
                            optional
                            onChange={(v) =>
                              setMember(i, { department: v, year: yearFromDepartment(v) })
                            }
                          />

                        </div>
                        {issues.length > 0 && (
                          <ul className="mt-3 space-y-1 font-mono text-[11px] text-primary">
                            {issues.map((msg) => (
                              <li key={msg}>! {msg}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      );
                    })
                  )}

                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
                    {[
                      ["TEAM", team.team_name],
                      ["LEADER", `${team.leader_name} · ${team.leader_email}`],
                      ["COLLEGE", team.college],
                      ["SIZE", `${teamSize} members`],
                      ["FEE / HEAD", formatMoney(fee, currency)],
                      ["TOTAL PAYABLE", formatMoney(total, currency)],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-surface p-4">
                        <p className="font-mono text-[10px] tracking-[0.3em] text-primary">{k}</p>
                        <p className="mt-1 text-sm">{v}</p>
                      </div>
                    ))}
                  </div>
                  <ul className="space-y-2 font-mono text-xs text-muted-foreground">
                    {[leaderMember, ...members.slice(0, coMemberCount)].map((m, i) => (
                      <li key={i}>
                        {String(i + 1).padStart(2, "0")} · {m.full_name} · {m.email} · {m.phone}
                        {i === 0 && " · LEADER"}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    On confirming, you'll get a UPI QR for {formatMoney(total, currency)}. Your slot
                    is locked only after our team verifies the transaction reference (UTR).
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground">
              TOTAL: <span className="text-primary">{formatMoney(total, currency)}</span>
            </p>
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="clip-notch border border-border px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] uppercase hover:border-primary hover:text-primary"
                >
                  [ Back ]
                </button>
              )}
              {step < 2 ? (
                <button
                  type="button"
                  disabled={!stepValid()}
                  onClick={() => setStep((s) => s + 1)}
                  className="clip-notch bg-primary px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase transition-shadow hover:shadow-[var(--glow-red)] disabled:opacity-50"
                >
                  [ Continue ]
                </button>
              ) : (
                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate()}
                  className="clip-notch bg-primary px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase transition-shadow hover:shadow-[var(--glow-red)] disabled:opacity-60"
                >
                  {mutation.isPending ? "SUBMITTING..." : "[ Confirm & Pay ]"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
