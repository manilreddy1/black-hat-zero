/**
 * Font catalogue for participation certificates.
 * System stacks render instantly; Google families are loaded on demand in the
 * browser (admin preview + canvas render) before any text is drawn.
 */

export type CertFont = { family: string; google: boolean };

export const SYSTEM_FONTS = [
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "Georgia",
  "Times New Roman",
  "Garamond",
  "Palatino Linotype",
  "Baskerville",
  "Arial",
  "Helvetica",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Courier New",
];

/** Google families grouped the way a certificate designer thinks about them. */
export const GOOGLE_FONT_GROUPS: Record<string, string[]> = {
  "Classic serif": [
    "Playfair Display",
    "Cormorant Garamond",
    "EB Garamond",
    "Libre Baskerville",
    "Cinzel",
    "Cinzel Decorative",
    "Crimson Pro",
    "Lora",
    "Merriweather",
    "Spectral",
    "Bodoni Moda",
    "Marcellus",
    "Trajan-like (Forum)",
  ],
  "Script & signature": [
    "Great Vibes",
    "Alex Brush",
    "Allura",
    "Parisienne",
    "Pinyon Script",
    "Tangerine",
    "Sacramento",
    "Dancing Script",
    "Yellowtail",
    "Mrs Saint Delafield",
    "Petit Formal Script",
    "Italianno",
    "Kaushan Script",
    "Satisfy",
  ],
  "Calligraphic & blackletter": [
    "UnifrakturMaguntia",
    "Cormorant Unicase",
    "Rozha One",
    "Almendra",
    "IM Fell English",
  ],
  "Modern sans": [
    "Montserrat",
    "Poppins",
    "Raleway",
    "Inter",
    "Work Sans",
    "Oswald",
    "Josefin Sans",
    "Outfit",
    "Manrope",
    "Bebas Neue",
  ],
  Monospace: ["JetBrains Mono", "Share Tech Mono", "Space Mono", "IBM Plex Mono", "Roboto Mono"],
};

const ALIASES: Record<string, string> = { "Trajan-like (Forum)": "Forum" };

export const ALL_GOOGLE_FONTS = Object.values(GOOGLE_FONT_GROUPS).flat();

/** The CSS family actually used for rendering (resolves display aliases). */
export function cssFamily(font: string) {
  return ALIASES[font] ?? font;
}

export function isSystemFont(font: string) {
  return SYSTEM_FONTS.includes(cssFamily(font));
}

const loaded = new Set<string>();

/** Injects a Google Fonts stylesheet (or a custom URL) once per family. */
export function ensureFontLoaded(font: string, url?: string) {
  if (typeof document === "undefined") return;
  const family = cssFamily(font);
  if (!family || isSystemFont(family)) return;
  const href =
    url && url.trim()
      ? url.trim()
      : `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(
          /%20/g,
          "+",
        )}:wght@300;400;500;600;700;800&display=swap`;
  if (loaded.has(href)) return;
  loaded.add(href);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

/** Waits until every requested face is usable so canvas draws are not blank. */
export async function waitForFonts(
  specs: { font: string; url?: string; weight?: string; size?: number }[],
) {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  for (const s of specs) ensureFontLoaded(s.font, s.url);
  await Promise.all(
    specs
      .filter((s) => !isSystemFont(s.font))
      .map((s) =>
        document.fonts
          .load(`${s.weight ?? "400"} ${Math.max(16, s.size ?? 40)}px "${cssFamily(s.font)}"`)
          .catch(() => undefined),
      ),
  );
  await document.fonts.ready.catch(() => undefined);
}

/** Quoted family for canvas `ctx.font` / CSS `fontFamily`. */
export function fontStack(font: string) {
  const family = cssFamily(font);
  return isSystemFont(family) ? family : `"${family}", serif`;
}
