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

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: () => ({
    meta: [
      { title: "BLACK HAT#0 '26 — Hackathon for Hackers" },
      {
        name: "description",
        content:
          "BLACK HAT ZERO '26: a 24-hour hackathon for hackers. Think like a hacker, innovate like a leader. Register your team of up to 4.",
      },
      { property: "og:title", content: "BLACK HAT#0 '26 — Hackathon for Hackers" },
      {
        property: "og:description",
        content: "Code. Break. Innovate. Own the system. Register your team for BLACK HAT ZERO '26.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(siteContentQuery);
  const settings = data.settings ?? null;

  return (
    <>
      <Hero settings={settings} />
      <AboutSection settings={settings} />
      <EventSection settings={settings} />
      <ChallengesSection challenges={data.challenges} />
      <TimelineSection timeline={data.timeline} />
      <RulesSection rules={data.rules} />
      <PrizesSection prizes={data.prizes} currency={settings?.currency} />
      <SponsorsSection sponsors={data.sponsors} />
      <FaqSection faqs={data.faqs} />
      <ContactSection settings={settings} />
    </>
  );
}
