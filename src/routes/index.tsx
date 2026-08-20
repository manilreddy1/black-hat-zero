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
    <div className="fixed top-0 right-0 left-0 z-50 border-b border-primary/30 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-foreground sm:text-base">
          <span className="mr-2 inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
          EVENT POSTPONED: BLACK HAT ZERO &apos;26 is now scheduled for{" "}
          <strong className="text-primary">2 &amp; 3 September</strong> instead of 21 &amp; 22 August.
        </p>
        <button
          onClick={() => {
            localStorage.setItem("bh-postponed-seen", "1");
            setDismissed(true);
          }}
          className="clip-notch shrink-0 bg-primary px-4 py-1.5 font-mono text-xs font-bold tracking-[0.15em] text-primary-foreground uppercase hover:shadow-[var(--glow-red)]"
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
