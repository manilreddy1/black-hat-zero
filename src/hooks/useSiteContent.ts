import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSiteContent } from "@/lib/public.functions";

export const siteContentQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: () => getSiteContent(),
  staleTime: 60_000,
});

export type SiteContent = Awaited<ReturnType<typeof getSiteContent>>;
export type EventSettings = NonNullable<SiteContent["settings"]>;

/** Returns a translator that resolves admin-editable copy by key. */
export function useT() {
  const { data } = useQuery(siteContentQuery);
  const texts = data?.texts ?? {};
  return (key: string, fallback = "") => {
    const v = texts[key];
    return v === undefined || v === null ? fallback : v;
  };
}

export function textOf(
  texts: Record<string, string> | undefined,
  key: string,
  fallback = "",
): string {
  const v = texts?.[key];
  return v === undefined || v === null || v === "" ? fallback : v;
}
