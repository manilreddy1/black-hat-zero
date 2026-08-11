import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { DynamicLink } from "./DynamicLink";
import { siteContentQuery, useT } from "@/hooks/useSiteContent";

const FALLBACK_NAV = [
  { id: "home", label: "Home", href: "/", is_button: false, new_tab: false },
  { id: "about", label: "About", href: "/about", is_button: false, new_tab: false },
  { id: "event", label: "Event", href: "/event", is_button: false, new_tab: false },
  { id: "timeline", label: "Timeline", href: "/timeline", is_button: false, new_tab: false },
  { id: "rules", label: "Rules", href: "/rules", is_button: false, new_tab: false },
  { id: "prizes", label: "Prizes", href: "/prizes", is_button: false, new_tab: false },
  { id: "faq", label: "FAQ", href: "/faq", is_button: false, new_tab: false },
  { id: "status", label: "Status", href: "/status", is_button: false, new_tab: false },
  { id: "team", label: "Team Login", href: "/team", is_button: false, new_tab: false },
  { id: "register", label: "Register Now", href: "/register", is_button: true, new_tab: false },
];

export function SiteNav() {
  const t = useT();
  const { data } = useQuery(siteContentQuery);
  const items = (data?.nav?.length ? data.nav : FALLBACK_NAV) as Array<{
    id: string;
    label: string;
    href: string;
    is_button: boolean;
    new_tab: boolean;
  }>;
  const links = items.filter((i) => !i.is_button);
  const buttons = items.filter((i) => i.is_button);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-border bg-background/85 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"
        aria-label="Main"
      >
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Logo className="h-9 w-9" />
          <span className="font-display text-lg font-bold tracking-widest">
            {t("brand.name_prefix", "BLACK")}
            <span className="text-primary">{t("brand.name_suffix", "HAT#0")}</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((item) => (
            <li key={item.id}>
              <DynamicLink
                href={item.href}
                newTab={item.new_tab}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </DynamicLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {buttons.map((item) => (
            <DynamicLink
              key={item.id}
              href={item.href}
              newTab={item.new_tab}
              className="clip-notch hidden bg-primary px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[var(--glow-red)] sm:inline-block"
            >
              {item.label}
            </DynamicLink>
          ))}

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-10 w-10 flex-col items-center justify-center gap-1.5 border border-border lg:hidden"
          >
            <motion.span
              animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="block h-px w-5 bg-foreground"
            />
            <motion.span
              animate={open ? { opacity: 0 } : { opacity: 1 }}
              className="block h-px w-5 bg-primary"
            />
            <motion.span
              animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="block h-px w-5 bg-foreground"
            />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid-bg fixed inset-x-0 top-16 bottom-0 z-40 border-t border-border bg-background/98 px-6 py-8 lg:hidden"
          >
            <ul className="space-y-1">
              {links.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <DynamicLink
                    href={item.href}
                    newTab={item.new_tab}
                    onClick={() => setOpen(false)}
                    className="block border-b border-border/60 py-4 font-display text-2xl uppercase tracking-wider"
                  >
                    <span className="mr-3 font-mono text-xs text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </DynamicLink>
                </motion.li>
              ))}
            </ul>
            {buttons.map((item) => (
              <DynamicLink
                key={item.id}
                href={item.href}
                newTab={item.new_tab}
                onClick={() => setOpen(false)}
                className="clip-notch mt-8 block bg-primary py-4 text-center font-mono text-sm font-bold uppercase tracking-[0.2em] text-primary-foreground"
              >
                {item.label}
              </DynamicLink>
            ))}

          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
