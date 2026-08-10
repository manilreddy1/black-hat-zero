import { useQuery } from "@tanstack/react-query";
import { Logo } from "./Logo";
import { DynamicLink } from "./DynamicLink";
import { siteContentQuery, useT, type EventSettings } from "@/hooks/useSiteContent";

const FALLBACK_LINKS = [
  { id: "about", label: "About", href: "/about", new_tab: false },
  { id: "event", label: "Event", href: "/event", new_tab: false },
  { id: "timeline", label: "Timeline", href: "/timeline", new_tab: false },
  { id: "rules", label: "Rules", href: "/rules", new_tab: false },
  { id: "prizes", label: "Prizes", href: "/prizes", new_tab: false },
  { id: "faq", label: "FAQ", href: "/faq", new_tab: false },
  { id: "register", label: "Register", href: "/register", new_tab: false },
  { id: "status", label: "Track Status", href: "/status", new_tab: false },
  { id: "contact", label: "Contact", href: "/contact", new_tab: false },
];

export function SiteFooter({ settings }: { settings: EventSettings | null }) {
  const t = useT();
  const { data } = useQuery(siteContentQuery);
  const navItems = (data?.nav?.length ? data.nav : FALLBACK_LINKS) as Array<{
    id: string;
    label: string;
    href: string;
    new_tab: boolean;
  }>;
  const pages = (data?.pages ?? []) as Array<{ id: string; slug: string; title: string }>;
  const links = [
    ...navItems.map((n) => ({ id: n.id, label: n.label, href: n.href, new_tab: n.new_tab })),
    ...pages.map((p) => ({ id: p.id, label: p.title, href: `/p/${p.slug}`, new_tab: false })),
  ];
  return (
    <footer className="relative border-t border-border bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <Logo className="h-12 w-12" />
            <div>
              <p className="font-display text-lg font-bold tracking-widest">
                {t("brand.name_prefix", "BLACK")}
                <span className="text-primary">{t("brand.name_suffix", "HAT#0")}</span>
              </p>
              <p className="font-mono text-[11px] tracking-[0.3em] text-primary">
                {t("brand.kicker", "HACKATHON FOR HACKERS")}
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            {settings?.tagline ?? ""}
          </p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
            {t("footer.nav_title", "Navigate")}
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {links.map((l) => (
              <li key={l.id}>
                <DynamicLink
                  href={l.href}
                  newTab={l.new_tab}
                  className="transition-colors hover:text-primary"
                >
                  {l.label}
                </DynamicLink>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
            {t("footer.contact_title", "Contact")}
          </p>
          <ul className="mt-4 space-y-2 font-mono text-sm text-muted-foreground">
            <li>{settings?.college}</li>
            <li>{settings?.venue}</li>
            <li>
              <a href={`mailto:${settings?.contact_email}`} className="hover:text-primary">
                {settings?.contact_email}
              </a>
            </li>
            <li>
              <a href={`tel:${settings?.contact_phone}`} className="hover:text-primary">
                {settings?.contact_phone}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-6 py-5 text-center font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
        © {new Date().getFullYear()} {t("brand.name_prefix", "BLACK")}{" "}
        {t("brand.name_suffix", "HAT#0")} —{" "}
        <span className="text-primary">
          {t("footer.bottom", "CODE. BREAK. INNOVATE. OWN THE SYSTEM.")}
        </span>
      </div>
    </footer>
  );
}
