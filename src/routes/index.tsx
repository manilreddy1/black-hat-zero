import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/hooks/useSiteContent";
import { Logo } from "@/components/site/Logo";
import { Hero } from "@/components/site/Hero";
import {
  AboutSection,
  ChallengesSection,
  ContactSection,
  EventSection,
  FaqSection,
  PrizesSection,
  RulesSection,
  SponsorsSection,
  TimelineSection,
} from "@/components/sections/Sections";
import { CustomSection } from "@/components/sections/CustomSection";
import { CertificatesSection } from "@/components/sections/CertificatesSection";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: ({ loaderData }) => {
    const texts = loaderData?.texts ?? {};
    const title = texts["seo.home_title"] || "BLACK HAT#0 '26 — Hackathon for Hackers";
    const description =
      texts["seo.home_description"] ||
      "BLACK HAT ZERO '26: a 24-hour hackathon for hackers. Register your team of up to 4.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: Home,
});

function PostponementBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem("bh-postponed-seen");
    setDismissed(seen === "1");
  }, []);

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="panel clip-notch relative flex max-w-lg flex-col items-center gap-6 p-8 text-center sm:p-12">
        <span className="absolute top-0 left-0 h-px w-full bg-primary/50" />
        <span className="absolute bottom-0 right-0 h-px w-full bg-primary/50" />

        <Logo className="h-24 w-24 sm:h-32 sm:w-32" />

        <div>
          <h2 className="font-display text-2xl font-bold tracking-wider uppercase text-primary sm:text-3xl">
            Event Postponed
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            BLACK HAT ZERO &apos;26 has been rescheduled.
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground sm:text-xl">
            21 &amp; 22 August {" "}
            <span className="mx-2 text-primary">→</span> 2 &amp; 3 September
          </p>
        </div>

        <button
          onClick={() => {
            localStorage.setItem("bh-postponed-seen", "1");
            setDismissed(true);
          }}
          className="clip-notch w-full max-w-xs bg-primary px-8 py-3 font-mono text-sm font-bold tracking-[0.2em] text-primary-foreground uppercase transition-shadow hover:shadow-[var(--glow-red)]"
        >
          OK
        </button>
      </div>
    </div>
  );
}

function Home() {
  const { data } = useSuspenseQuery(siteContentQuery);
  const settings = data.settings ?? null;
  const sections = (data.sections ?? []).filter((s) => s.is_visible);

  const builtin: Record<string, ReactNode> = {
    hero: <Hero settings={settings} />,
    about: <AboutSection settings={settings} />,
    event: <EventSection settings={settings} />,
    challenges: <ChallengesSection challenges={data.challenges} />,
    timeline: <TimelineSection timeline={data.timeline} />,
    rules: <RulesSection rules={data.rules} />,
    prizes: <PrizesSection prizes={data.prizes} currency={settings?.currency} />,
    sponsors: <SponsorsSection sponsors={data.sponsors} />,
    faq: <FaqSection faqs={data.faqs} />,
    contact: <ContactSection settings={settings} />,
    certificates: <CertificatesSection />,
  };

  return (
    <>
      <PostponementBanner />
      {sections.map((s) => (
        <div key={s.id}>
          {builtin[s.key] ?? (
            <CustomSection
              sectionKey={s.key}
              label={s.label}
              title={s.title}
              subtitle={s.subtitle}
              body={s.body}
            />
          )}
        </div>
      ))}
    </>
  );
}
