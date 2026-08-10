import { queryOptions, useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { getSiteContent } from "@/lib/public.functions";
import { getPreviewContent } from "@/lib/staff.functions";

export const siteContentQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: () => getSiteContent(),
  staleTime: 60_000,
});

/** Staff-only draft content used by ?preview=1. */
export const previewContentQuery = queryOptions({
  queryKey: ["site-content-preview"],
  queryFn: () => getPreviewContent(),
  staleTime: 0,
  retry: false,
});

/** True when the current URL carries ?preview=1. */
export function usePreviewMode() {
  return useRouterState({
    select: (s) => {
      const v = (s.location.search as Record<string, unknown>)["preview"];
      return v === "1" || v === 1 || v === true || v === "true";
    },
  });
}

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
