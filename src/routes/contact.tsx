import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/hooks/useSiteContent";
import { ContactSection } from "@/components/sections/Sections";

export const Route = createFileRoute("/contact")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: () => ({
    meta: [
      { title: "Contact — BLACK HAT#0 '26" },
      {
        name: "description",
        content: "Reach the BLACK HAT ZERO '26 organising crew for registration, payment or sponsorship queries.",
      },
      { property: "og:title", content: "Contact — BLACK HAT#0 '26" },
      {
        property: "og:description",
        content: "Reach the BLACK HAT ZERO '26 crew for registration, payment or sponsorship queries.",
      },
    ],
  }),
  component: () => {
    const { data } = useSuspenseQuery(siteContentQuery);
    return (
      <div className="pt-24">
        <ContactSection settings={data.settings ?? null} />
      </div>
    );
  },
});
