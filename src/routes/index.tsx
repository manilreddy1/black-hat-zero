import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/hooks/useSiteContent";
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
