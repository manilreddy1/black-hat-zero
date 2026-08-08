import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/hooks/useSiteContent";
import { PrizesSection, SponsorsSection } from "@/components/sections/Sections";

export const Route = createFileRoute("/prizes")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: () => ({
    meta: [
      { title: "Prize Pool — BLACK HAT#0 '26" },
      {
        name: "description",
        content: "Cash bounties, track awards and sponsor perks up for grabs at BLACK HAT ZERO '26.",
      },
      { property: "og:title", content: "Prize Pool — BLACK HAT#0 '26" },
      {
        property: "og:description",
        content: "Cash bounties, track awards and sponsor perks at BLACK HAT ZERO '26.",
      },
    ],
  }),
  component: () => {
    const { data } = useSuspenseQuery(siteContentQuery);
    return (
      <div className="pt-24">
        <PrizesSection prizes={data.prizes} currency={data.settings?.currency} />
        <SponsorsSection sponsors={data.sponsors} />
      </div>
    );
  },
});
