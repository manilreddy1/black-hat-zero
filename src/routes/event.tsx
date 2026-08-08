import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/hooks/useSiteContent";
import { ChallengesSection, EventSection } from "@/components/sections/Sections";

export const Route = createFileRoute("/event")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: () => ({
    meta: [
      { title: "Event Brief — BLACK HAT#0 '26" },
      {
        name: "description",
        content:
          "Date, venue, team size, fee and challenge tracks for the BLACK HAT ZERO '26 hackathon.",
      },
      { property: "og:title", content: "Event Brief — BLACK HAT#0 '26" },
      {
        property: "og:description",
        content: "Date, venue, team size, fee and challenge tracks for BLACK HAT ZERO '26.",
      },
    ],
  }),
  component: () => {
    const { data } = useSuspenseQuery(siteContentQuery);
    return (
      <div className="pt-24">
        <EventSection settings={data.settings ?? null} />
        <ChallengesSection challenges={data.challenges} />
      </div>
    );
  },
});
