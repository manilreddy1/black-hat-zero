import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionShell } from "@/components/site/SectionShell";
import { Reveal } from "@/components/site/GlitchText";
import { TerminalPanel } from "@/components/site/TerminalPanel";
import { submitContactMessage } from "@/lib/public.functions";
import { formatMoney } from "@/lib/constants";
import { useT, type SiteContent, type EventSettings } from "@/hooks/useSiteContent";

export function AboutSection({ settings }: { settings: EventSettings | null }) {
  const t = useT();
  return (
    <SectionShell
      id="about"
      eyebrow={t("about.eyebrow", "// 01 — ABOUT")}
      title={t("about.title", "Think like a hacker, innovate like a leader")}
      subtitle={settings?.about}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4]
            .map((n) => [t(`about.card${n}_title`), t(`about.card${n}_body`)])
            .filter(([title, body]) => title || body)
            .map(([title, body], i) => (
              <Reveal key={title} delay={i * 0.06}>
                <div className="panel clip-notch group h-full p-5 transition-colors hover:border-primary/60">
                  <p className="font-mono text-[11px] tracking-[0.25em] text-primary">{title}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{body}</p>
                </div>
              </Reveal>
            ))}
        </div>
        <Reveal delay={0.15}>
          <TerminalPanel className="h-full" />
        </Reveal>
      </div>
    </SectionShell>
  );
}

export function EventSection({ settings }: { settings: EventSettings | null }) {
  const t = useT();
  if (!settings) return null;
  const fmt = (iso: string, withTime: boolean) =>
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit" as const, minute: "2-digit" as const, hour12: true } : {}),
    }).format(new Date(iso));
  const rows: [string, string][] = [
    ["EVENT", settings.event_name],
    ["DATE", fmt(settings.event_date, false)],
    ["START", settings.start_time],
    ["END", settings.end_time],
    ["VENUE", settings.venue],
    ["COLLEGE", settings.college],
    ["TEAM SIZE", `${settings.min_team_size} – ${settings.max_team_size} members`],
    ["FEE", `${formatMoney(settings.registration_fee, settings.currency)} / participant`],
    ["DEADLINE", fmt(settings.registration_deadline, true)],
    ["ELIGIBILITY", settings.eligibility],
    ["MODE", settings.mode],
  ];
  return (
    <SectionShell
      id="event"
      eyebrow={t("event.eyebrow", "// 02 — EVENT BRIEF")}
      title={t("event.title", "Mission parameters")}
      subtitle={t("event.subtitle", "Everything below is live from the organiser control panel.")}
    >
      <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([k, v], i) => (
          <motion.div
            key={k}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
            className="bg-surface p-5"
          >
            <p className="font-mono text-[10px] tracking-[0.3em] text-primary">{k}</p>
            <p className="mt-2 text-sm font-medium text-foreground">{v}</p>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}

export function ChallengesSection({ challenges }: { challenges: SiteContent["challenges"] }) {
  const t = useT();
  return (
    <SectionShell
      id="challenges"
      eyebrow={t("challenges.eyebrow", "// 03 — TRACKS")}
      title={t("challenges.title", "Challenge tracks")}
      subtitle={t("challenges.subtitle", "Pick your battlefield. Each track is scored independently.")}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {challenges.map((c, i) => (
          <Reveal key={c.id} delay={i * 0.05}>
            <div className="panel clip-notch group relative h-full overflow-hidden p-6 transition-transform hover:-translate-y-1">
              <span className="absolute top-0 left-0 h-px w-0 bg-primary transition-all duration-500 group-hover:w-full" />
              <p className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-display text-xl font-bold tracking-wide">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}

export function TimelineSection({ timeline }: { timeline: SiteContent["timeline"] }) {
  const t = useT();
  return (
    <SectionShell
      id="timeline"
      eyebrow={t("timeline.eyebrow", "// 04 — TIMELINE")}
      title={t("timeline.title", "Operation schedule")}
      subtitle={t("timeline.subtitle") || undefined}
    >
      <ol className="relative ml-3 border-l border-border">
        {timeline.map((t, i) => (
          <motion.li
            key={t.id}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.05 }}
            className="relative py-6 pl-8"
          >
            <span className="absolute top-8 -left-[7px] h-3 w-3 rotate-45 border border-primary bg-background" />
            <p className="font-mono text-[11px] tracking-[0.25em] text-primary">{t.happens_at}</p>
            <h3 className="mt-2 font-display text-lg font-bold tracking-wider uppercase">
              {t.title}
            </h3>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t.description}</p>
          </motion.li>
        ))}
      </ol>
    </SectionShell>
  );
}

export function RulesSection({ rules }: { rules: SiteContent["rules"] }) {
  const t = useT();
  return (
    <SectionShell
      id="rules"
      eyebrow={t("rules.eyebrow", "// 05 — PROTOCOL")}
      title={t("rules.title", "Rules of engagement")}
      subtitle={t("rules.subtitle", "Read carefully. Violations end your run.")}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {rules.map((r, i) => (
          <Reveal key={r.id} delay={i * 0.04}>
            <div className="panel h-full border-l-2 border-l-primary p-5">
              <p className="font-mono text-[11px] tracking-[0.25em] text-primary uppercase">
                {r.category}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{r.content}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}

export function PrizesSection({
  prizes,
  currency = "INR",
}: {
  prizes: SiteContent["prizes"];
  currency?: string | undefined;
}) {
  const t = useT();
  return (
    <SectionShell
      id="prizes"
      eyebrow={t("prizes.eyebrow", "// 06 — BOUNTY")}
      title={t("prizes.title", "Prize pool")}
      subtitle={t("prizes.subtitle") || undefined}
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {prizes.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.06}>
            <div
              className={`panel clip-notch relative h-full overflow-hidden p-6 text-center transition-transform hover:-translate-y-1 ${
                i === 0 ? "border-primary/70" : ""
              }`}
              style={i === 0 ? { boxShadow: "var(--glow-soft)" } : undefined}
            >
              <p className="font-mono text-[11px] tracking-[0.3em] text-primary">{p.tier}</p>
              <h3 className="mt-4 font-display text-lg font-bold tracking-widest uppercase">
                {p.title}
              </h3>
              <p className="mt-3 font-display text-3xl font-bold text-primary text-glow">
                {p.amount}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">{p.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mt-6 font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
        ALL AMOUNTS IN {currency}
      </p>
    </SectionShell>
  );
}

function SponsorCard({ s }: { s: SiteContent["sponsors"][number] }) {
  return (
    <a
      href={s.website ?? "#"}
      target={s.website ? "_blank" : undefined}
      rel="noreferrer"
      className="panel clip-notch group/card flex h-32 w-56 shrink-0 flex-col items-center justify-center gap-2 p-4 transition-colors hover:border-primary/60"
      aria-label={s.name}
    >
      {s.logo_url ? (
        <img
          src={s.logo_url}
          alt={`${s.name} logo`}
          loading="lazy"
          className="max-h-14 max-w-full object-contain opacity-80 grayscale transition duration-300 group-hover/card:opacity-100 group-hover/card:grayscale-0"
        />
      ) : (
        <span className="font-display text-lg font-bold tracking-widest">{s.name}</span>
      )}
      <span className="line-clamp-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
        {s.name}
      </span>
    </a>
  );
}

function SponsorTrack({ list }: { list: SiteContent["sponsors"] }) {
  // Repeat until the strip is comfortably wider than any viewport, then render
  // it twice so the -50% keyframe loops without a visible seam.
  const reps = Math.max(1, Math.ceil(8 / Math.max(list.length, 1)));
  const half = Array.from({ length: reps }, () => list).flat();
  return (
    <div className="group relative mt-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-4 pr-4" aria-hidden={copy === 1}>
            {half.map((s, i) => (
              <SponsorCard key={`${copy}-${s.id}-${i}`} s={s} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SponsorsSection({ sponsors }: { sponsors: SiteContent["sponsors"] }) {
  const t = useT();
  const tiers = [...new Set(sponsors.map((s) => s.tier))];
  if (sponsors.length === 0) return null;
  return (
    <SectionShell
      id="sponsors"
      eyebrow={t("sponsors.eyebrow", "// 07 — BACKED BY")}
      title={t("sponsors.title", "Sponsors & partners")}
      subtitle={t("sponsors.subtitle") || undefined}
    >
      <div className="space-y-8">
        {tiers.map((tier) => (
          <div key={tier}>
            <div className="flex items-center gap-3">
              <p className="font-mono text-[11px] tracking-[0.3em] text-primary whitespace-nowrap">
                {tier}
              </p>
              <span className="h-px flex-1 bg-border" />
            </div>
            <SponsorTrack list={sponsors.filter((s) => s.tier === tier)} />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}


export function FaqSection({ faqs }: { faqs: SiteContent["faqs"] }) {
  const t = useT();
  return (
    <SectionShell
      id="faq"
      eyebrow={t("faq.eyebrow", "// 08 — FAQ")}
      title={t("faq.title", "Frequently asked")}
    >
      <Accordion type="single" collapsible className="mx-auto max-w-3xl">
        {faqs.map((f) => (
          <AccordionItem key={f.id} value={f.id} className="border-border">
            <AccordionTrigger className="text-left font-display text-base tracking-wide hover:text-primary hover:no-underline">
              {f.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{f.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionShell>
  );
}

export function ContactSection({ settings }: { settings: EventSettings | null }) {
  const t = useT();
  const send = useServerFn(submitContactMessage);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const mutation = useMutation({
    mutationFn: () => send({ data: form }),
    onSuccess: () => {
      toast.success("Message transmitted. We'll respond shortly.");
      setForm({ name: "", email: "", subject: "", message: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Could not send your message."),
  });

  const field =
    "w-full border border-input bg-surface px-3 py-3 font-mono text-sm outline-none transition-shadow focus:border-primary focus:shadow-[var(--glow-red)]";

  return (
    <SectionShell
      id="contact"
      eyebrow={t("contact.eyebrow", "// 09 — CONTACT")}
      title={t("contact.title", "Open a channel")}
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="panel clip-notch space-y-4 p-6">
          <div>
            <p className="font-mono text-[11px] tracking-[0.3em] text-primary">ORGANISER</p>
            <p className="mt-1 text-sm">{settings?.college}</p>
          </div>
          <div>
            <p className="font-mono text-[11px] tracking-[0.3em] text-primary">VENUE</p>
            <p className="mt-1 text-sm">{settings?.venue}</p>
          </div>
          <div>
            <p className="font-mono text-[11px] tracking-[0.3em] text-primary">EMAIL</p>
            <a href={`mailto:${settings?.contact_email}`} className="mt-1 block text-sm hover:text-primary">
              {settings?.contact_email}
            </a>
          </div>
          <div>
            <p className="font-mono text-[11px] tracking-[0.3em] text-primary">PHONE</p>
            <a href={`tel:${settings?.contact_phone}`} className="mt-1 block text-sm hover:text-primary">
              {settings?.contact_phone}
            </a>
          </div>
        </div>

        <form
          className="panel clip-notch space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground">
                NAME
              </span>
              <input
                required
                minLength={2}
                maxLength={80}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`mt-2 ${field}`}
              />
            </label>
            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground">
                EMAIL
              </span>
              <input
                required
                type="email"
                maxLength={120}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`mt-2 ${field}`}
              />
            </label>
          </div>
          <label className="block">
            <span className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground">
              SUBJECT
            </span>
            <input
              maxLength={120}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className={`mt-2 ${field}`}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground">
              MESSAGE
            </span>
            <textarea
              required
              minLength={10}
              maxLength={1500}
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className={`mt-2 ${field}`}
            />
          </label>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="clip-notch w-full bg-primary py-3.5 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase transition-shadow hover:shadow-[var(--glow-red)] disabled:opacity-60"
          >
            {mutation.isPending ? "TRANSMITTING..." : "[ SEND MESSAGE ]"}
          </button>
        </form>
      </div>
    </SectionShell>
  );
}
