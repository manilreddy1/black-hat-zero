import { Reveal } from "./GlitchText";

export function SectionShell({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative border-t border-border/60 py-20 sm:py-28 ${className}`}>
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="font-mono text-[11px] tracking-[0.4em] text-primary">{eyebrow}</p>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,5vw,3.4rem)] leading-none font-bold tracking-tight uppercase">
            {title}
          </h2>
          {subtitle && <p className="mt-4 max-w-2xl text-muted-foreground">{subtitle}</p>}
          <div className="mt-6 h-px w-full bg-gradient-to-r from-primary/70 via-border to-transparent" />
        </Reveal>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
