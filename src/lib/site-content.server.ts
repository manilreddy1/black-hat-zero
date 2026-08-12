import { publicClient } from "./db.server";

/**
 * Public site content is identical for every visitor, so we cache it in the
 * worker isolate for a few seconds. Under load (hundreds of concurrent
 * visitors) this collapses ~12 database round-trips per request into one
 * refresh per TTL window, while staying fresh enough for admin edits.
 */
const TTL_MS = 15_000;

type Content = Awaited<ReturnType<typeof loadSiteContent>>;

let cached: { at: number; data: Content } | null = null;
let inflight: Promise<Content> | null = null;

export async function loadSiteContent() {
  const sb = publicClient();
  const [settings, timeline, prizes, rules, faqs, sponsors, challenges, announcements, texts, sections, nav, pages] =
    await Promise.all([
      sb.from("event_settings").select("*").limit(1).maybeSingle(),
      sb.from("timeline_items").select("*").order("sort_order"),
      sb.from("prizes").select("*").order("sort_order"),
      sb.from("rules").select("*").order("sort_order"),
      sb.from("faqs").select("*").order("sort_order"),
      sb.from("sponsors").select("*").order("sort_order"),
      // Never expose problem_statement publicly — it is revealed only in the
      // team-lead portal once staff flip `themes_revealed`.
      sb
        .from("challenges")
        .select("id,title,description,icon,sort_order,is_published,created_at")
        .order("sort_order"),
      sb.from("announcements").select("*").order("created_at", { ascending: false }).limit(5),
      sb.from("site_texts").select("key,value"),
      sb.from("page_sections").select("*").order("sort_order"),
      sb.from("nav_items").select("*").eq("is_visible", true).order("sort_order"),
      sb.from("custom_pages").select("id,slug,title").eq("is_published", true).order("sort_order"),
    ]);
  const textMap: Record<string, string> = {};
  for (const row of texts.data ?? []) textMap[row.key] = row.value;
  return {
    settings: settings.data,
    timeline: timeline.data ?? [],
    prizes: prizes.data ?? [],
    rules: rules.data ?? [],
    faqs: faqs.data ?? [],
    sponsors: sponsors.data ?? [],
    challenges: challenges.data ?? [],
    announcements: announcements.data ?? [],
    sections: sections.data ?? [],
    nav: nav.data ?? [],
    pages: pages.data ?? [],
    texts: textMap,
  };
}

export async function getCachedSiteContent() {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.data;
  if (inflight) return inflight;
  inflight = loadSiteContent()
    .then((data) => {
      cached = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  try {
    return await inflight;
  } catch (err) {
    // Serve slightly stale content rather than failing the page under load.
    if (cached) return cached.data;
    throw err;
  }
}

/** Called after staff edits so changes appear immediately. */
export function invalidateSiteContent() {
  cached = null;
}
