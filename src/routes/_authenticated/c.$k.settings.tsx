import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { siteContentQuery } from "@/hooks/useSiteContent";
import { updateEventSettings } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/c/$k/settings")({
  component: SettingsPage,
});

const TEXT_FIELDS = [
  "event_name",
  "tagline",
  "about",
  "college",
  "venue",
  "event_date",
  "start_time",
  "end_time",
  "eligibility",
  "mode",
  "contact_email",
  "contact_phone",
  "upi_id",
  "upi_payee_name",
  "payment_instructions",
  "whatsapp_group_url",
] as const;

const NUMBER_FIELDS = [
  "registration_fee",
  "min_team_size",
  "max_team_size",
  "max_teams",
] as const;

const BOOL_FIELDS = [
  "registration_open",
  "payments_enabled",
  "waitlist_enabled",
  "maintenance_mode",
  "themes_revealed",
] as const;

const DATE_FIELDS = [
  { key: "registration_deadline", label: "registration deadline" },
  { key: "start_at", label: "event start (countdown)" },
] as const;

/** ISO string -> value for <input type="datetime-local"> in the user's local time */
function toLocalInput(value: unknown): string {
  if (!value) return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SettingsPage() {
  const { data } = useQuery(siteContentQuery);
  const save = useServerFn(updateEventSettings);
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (data?.settings) setForm({ ...data.settings });
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => save({ data: form }),
    onSuccess: () => {
      toast.success("Settings updated.");
      qc.invalidateQueries({ queryKey: ["site-content"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const input = "w-full border border-input bg-surface px-3 py-2.5 font-mono text-xs";

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// CONFIG</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-widest uppercase">
          Event settings
        </h1>
      </div>

      <div className="panel grid gap-4 p-6 sm:grid-cols-2">
        {TEXT_FIELDS.map((k) => (
          <label key={k} className="block">
            <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              {k.replace(/_/g, " ")}
            </span>
            <input
              value={String(form[k] ?? "")}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className={`mt-2 ${input}`}
            />
          </label>
        ))}
        {NUMBER_FIELDS.map((k) => (
          <label key={k} className="block">
            <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              {k.replace(/_/g, " ")}
            </span>
            <input
              type="number"
              value={Number(form[k] ?? 0)}
              onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })}
              className={`mt-2 ${input}`}
            />
          </label>
        ))}
        {DATE_FIELDS.map(({ key, label }) => (
          <label key={key} className="block">
            <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              {label}
            </span>
            <input
              type="datetime-local"
              value={toLocalInput(form[key])}
              onChange={(e) => {
                const v = e.target.value;
                const d = v ? new Date(v) : null;
                setForm({
                  ...form,
                  [key]: d && !Number.isNaN(d.getTime()) ? d.toISOString() : null,
                });
              }}
              className={`mt-2 ${input}`}
            />
          </label>
        ))}

        <div className="sm:col-span-2 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          {BOOL_FIELDS.map((k) => {
            const on = Boolean(form[k]);
            return (
              <button
                key={k}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => setForm({ ...form, [k]: !on })}
                className={`flex items-center justify-between gap-4 border px-4 py-3 text-left font-mono text-[11px] tracking-[0.15em] uppercase transition-colors ${
                  on
                    ? "border-primary/70 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>
                  {k === "themes_revealed"
                    ? "Show themes + problem statements in team-lead portal"
                    : k.replace(/_/g, " ")}
                </span>
                <span
                  className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
                    on ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${
                      on ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>


        <div className="sm:col-span-2">
          <button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="clip-notch bg-primary px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
          >
            {mutation.isPending ? "SAVING..." : "[ Save settings ]"}
          </button>
        </div>
      </div>
    </div>
  );
}
