import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/hooks/useSiteContent";
import { FaqSection } from "@/components/sections/Sections";

export const Route = createFileRoute("/faq")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: () => ({
    meta: [
      { title: "FAQ — BLACK HAT#0 '26" },
      {
        name: "description",
        content:
          "Answers on eligibility, fees, payment verification, team changes and what to bring to BLACK HAT ZERO '26.",
      },
      { property: "og:title", content: "FAQ — BLACK HAT#0 '26" },
      {
        property: "og:description",
        content: "Eligibility, fees, payment verification and team rules for BLACK HAT ZERO '26.",
      },
    ],
  }),
  component: () => {
    const { data } = useSuspenseQuery(siteContentQuery);
    return (
      <div className="pt-24">
        <FaqSection faqs={data.faqs} />
      </div>
    );
  },
});
