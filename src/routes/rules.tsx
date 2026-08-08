import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/hooks/useSiteContent";
import { RulesSection } from "@/components/sections/Sections";

export const Route = createFileRoute("/rules")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: () => ({
    meta: [
      { title: "Rules of Engagement — BLACK HAT#0 '26" },
      {
        name: "description",
        content:
          "Team, conduct, judging and disqualification rules for the BLACK HAT ZERO '26 hackathon.",
      },
      { property: "og:title", content: "Rules of Engagement — BLACK HAT#0 '26" },
      {
        property: "og:description",
        content: "Team, conduct, judging and disqualification rules for BLACK HAT ZERO '26.",
      },
    ],
  }),
  component: () => {
    const { data } = useSuspenseQuery(siteContentQuery);
    return (
      <div className="pt-24">
        <RulesSection rules={data.rules} />
      </div>
    );
  },
});
