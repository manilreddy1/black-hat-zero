import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { siteContentQuery, useT } from "@/hooks/useSiteContent";
import { createRegistration } from "@/lib/public.functions";
import { formatMoney } from "@/lib/constants";
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 ${field}`}
      />
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
    city: "",
  });
  const [members, setMembers] = useState<Member[]>(() =>
    Array.from({ length: max }, () => emptyMember()),
  );

  const total = useMemo(() => fee * teamSize, [fee, teamSize]);
  const deadlinePassed =
    !!settings && new Date(settings.registration_deadline).getTime() < Date.now();
  const closed = !settings?.registration_open || deadlinePassed;


  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          ...team,
          team_size: teamSize,
          members: members.slice(0, teamSize),
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

  const stepValid = () => {
    if (step === 0)
      return (
        team.team_name.trim().length >= 2 &&
        team.leader_name.trim().length >= 2 &&
        /.+@.+\..+/.test(team.leader_email) &&
        team.leader_phone.trim().length >= 7 &&
        team.college.trim().length >= 2 &&
        team.department.trim() &&
        team.year.trim() &&
        team.city.trim()
      );
    if (step === 1)
      return members
        .slice(0, teamSize)
        .every(
          (m) => m.full_name.trim().length >= 2 && /.+@.+\..+/.test(m.email) && m.phone.trim().length >= 7,
        );
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
                      value={team.leader_name}
                      onChange={(v) => setTeam({ ...team, leader_name: v })}
                    />
                    <Field
                      label="LEADER EMAIL"
                      type="email"
                      value={team.leader_email}
                      onChange={(v) => setTeam({ ...team, leader_email: v })}
                    />
                    <Field
                      label="LEADER PHONE"
                      value={team.leader_phone}
                      onChange={(v) => setTeam({ ...team, leader_phone: v })}
                    />
                    <Field
                      label="COLLEGE"
                      value={team.college}
                      onChange={(v) => setTeam({ ...team, college: v })}
                    />
                    <Field
                      label="DEPARTMENT"
                      value={team.department}
                      onChange={(v) => setTeam({ ...team, department: v })}
                    />
                    <Field
                      label="YEAR"
                      value={team.year}
                      onChange={(v) => setTeam({ ...team, year: v })}
                    />
                    <Field
                      label="CITY"
                      value={team.city}
                      onChange={(v) => setTeam({ ...team, city: v })}
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-8">
                  {members.slice(0, teamSize).map((m, i) => (
                    <div key={i} className="border-l-2 border-l-primary/70 pl-5">
                      <p className="font-mono text-[11px] tracking-[0.3em] text-primary">
                        MEMBER {String(i + 1).padStart(2, "0")} {i === 0 && "— TEAM LEADER"}
                      </p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field
                          label="FULL NAME"
                          value={m.full_name}
                          onChange={(v) => setMember(i, { full_name: v })}
                        />
                        <Field
                          label="EMAIL"
                          type="email"
                          value={m.email}
                          onChange={(v) => setMember(i, { email: v })}
                        />
                        <Field
                          label="PHONE"
                          value={m.phone}
                          onChange={(v) => setMember(i, { phone: v })}
                        />
                        <Field
                          label="STUDENT ID (OPTIONAL)"
                          required={false}
                          value={m.student_id}
                          onChange={(v) => setMember(i, { student_id: v })}
                        />
                        <Field
                          label="DEPARTMENT (OPTIONAL)"
                          required={false}
                          value={m.department}
                          onChange={(v) => setMember(i, { department: v })}
                        />
                        <Field
                          label="YEAR (OPTIONAL)"
                          required={false}
                          value={m.year}
                          onChange={(v) => setMember(i, { year: v })}
                        />
                      </div>
                    </div>
                  ))}
                  {members[0] && !members[0].full_name && (
                    <button
                      type="button"
                      onClick={() =>
                        setMember(0, {
                          full_name: team.leader_name,
                          email: team.leader_email,
                          phone: team.leader_phone,
                          department: team.department,
                          year: team.year,
                        })
                      }
                      className="font-mono text-[11px] tracking-[0.2em] text-primary underline-offset-4 hover:underline"
                    >
                      [ COPY LEADER DETAILS INTO MEMBER 01 ]
                    </button>
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
                    {members.slice(0, teamSize).map((m, i) => (
                      <li key={i}>
                        {String(i + 1).padStart(2, "0")} · {m.full_name} · {m.email} · {m.phone}
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
