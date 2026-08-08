import { queryOptions } from "@tanstack/react-query";
import { getSiteContent } from "@/lib/public.functions";

export const siteContentQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: () => getSiteContent(),
  staleTime: 60_000,
});

export type SiteContent = Awaited<ReturnType<typeof getSiteContent>>;
export type EventSettings = NonNullable<SiteContent["settings"]>;
