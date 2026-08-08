import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/hooks/useSiteContent";
import { TimelineSection } from "@/components/sections/Sections";

export const Route = createFileRoute("/timeline")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: () => ({
    meta: [
      { title: "Timeline — BLACK HAT#0 '26" },
      {
        name: "description",
        content: "Hour-by-hour schedule for BLACK HAT ZERO '26, from check-in to final judging.",
      },
      { property: "og:title", content: "Timeline — BLACK HAT#0 '26" },
      {
        property: "og:description",
        content: "Hour-by-hour schedule for BLACK HAT ZERO '26, from check-in to final judging.",
      },
    ],
  }),
  component: () => {
    const { data } = useSuspenseQuery(siteContentQuery);
    return (
      <div className="pt-24">
        <TimelineSection timeline={data.timeline} />
      </div>
    );
  },
});
