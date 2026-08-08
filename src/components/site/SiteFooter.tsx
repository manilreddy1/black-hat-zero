import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import type { EventSettings } from "@/hooks/useSiteContent";

export function SiteFooter({ settings }: { settings: EventSettings | null }) {
  return (
    <footer className="relative border-t border-border bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <Logo className="h-12 w-12" />
            <div>
              <p className="font-display text-lg font-bold tracking-widest">
                BLACK<span className="text-primary">HAT#0</span>
              </p>
              <p className="font-mono text-[11px] tracking-[0.3em] text-primary">
                HACKATHON FOR HACKERS
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            {settings?.tagline ?? "Code. Break. Innovate. Own the system."}
          </p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Navigate</p>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {[
              ["/about", "About"],
              ["/event", "Event"],
              ["/timeline", "Timeline"],
              ["/rules", "Rules"],
              ["/prizes", "Prizes"],
              ["/faq", "FAQ"],
              ["/register", "Register"],
              ["/status", "Track Status"],
              ["/contact", "Contact"],
              ["/auth", "Staff Login"],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="transition-colors hover:text-primary">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Contact</p>
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
        © {new Date().getFullYear()} BLACK HAT#0 — CODE. BREAK. INNOVATE.{" "}
        <span className="text-primary">OWN THE SYSTEM.</span>
      </div>
    </footer>
  );
}
