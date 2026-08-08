import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/hooks/useSiteContent";
import { AboutSection } from "@/components/sections/Sections";

export const Route = createFileRoute("/about")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: () => ({
    meta: [
      { title: "About — BLACK HAT#0 '26 Hackathon" },
      {
        name: "description",
        content:
          "What BLACK HAT ZERO '26 is about: an offensive-security hackathon where teams build, break and defend in 24 hours.",
      },
      { property: "og:title", content: "About — BLACK HAT#0 '26 Hackathon" },
      {
        property: "og:description",
        content: "An offensive-security hackathon where teams build, break and defend in 24 hours.",
      },
    ],
  }),
  component: () => {
    const { data } = useSuspenseQuery(siteContentQuery);
    return (
      <div className="pt-24">
        <AboutSection settings={data.settings ?? null} />
      </div>
    );
  },
});
