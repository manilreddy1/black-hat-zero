import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CyberBackground } from "./CyberBackground";
import { Countdown } from "./Countdown";
import { Logo } from "./Logo";
import { GlitchText } from "./GlitchText";
import type { EventSettings } from "@/hooks/useSiteContent";

export function Hero({ settings }: { settings: EventSettings | null }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [glow, setGlow] = useState({ x: 50, y: 40 });
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      setGlow({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    };
    const onScroll = () => setOffset(Math.min(window.scrollY, 400));
    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const live = settings?.event_state === "LIVE";

  return (
    <section
      ref={ref}
      id="home"
      className="scanlines relative flex min-h-[100svh] items-center overflow-hidden pt-24 pb-16"
    >
      <div className="grid-bg absolute inset-0 opacity-60" aria-hidden />
      <CyberBackground dense />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-[background] duration-300"
        style={{
          background: `radial-gradient(560px circle at ${glow.x}% ${glow.y}%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 65%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 to-transparent animate-sweep"
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div style={{ transform: `translateY(${offset * -0.08}px)` }}>
          {live && (
            <div className="mb-5 inline-flex items-center gap-2 border border-primary/60 bg-primary/10 px-3 py-1.5 font-mono text-[11px] tracking-[0.3em] text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> LIVE — HACKATHON IN
              PROGRESS
            </div>
          )}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-mono text-xs tracking-[0.45em] text-primary"
          >
            HACKATHON FOR HACKERS
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.7 }}
            className="mt-4 font-display text-[clamp(2.8rem,9vw,6.5rem)] leading-[0.9] font-bold tracking-tight"
          >
            <GlitchText text="BLACK" className="block" />
            <span className="block text-primary text-glow">HAT#0</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-6 max-w-lg font-mono text-sm leading-relaxed tracking-wider text-muted-foreground sm:text-base"
          >
            CODE. BREAK. INNOVATE.
            <br />
            <span className="text-foreground">OWN THE SYSTEM.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Link
              to="/register"
              className="clip-notch bg-primary px-7 py-4 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--glow-red)]"
            >
              [ Register Your Team ]
            </Link>
            <Link
              to="/event"
              className="clip-notch border border-border bg-surface/60 px-7 py-4 font-mono text-xs font-bold tracking-[0.2em] uppercase transition-colors hover:border-primary hover:text-primary"
            >
              [ Explore Event ]
            </Link>
          </motion.div>

          {settings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12"
            >
              <p className="mb-3 font-mono text-[11px] tracking-[0.3em] text-muted-foreground">
                {live ? "EVENT IN PROGRESS" : "COUNTDOWN TO BREACH"}
              </p>
              <Countdown target={settings.start_at} />
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ transform: `translateY(${offset * 0.05}px)` }}
          className="relative mx-auto hidden max-w-md lg:block"
        >
          <div
            aria-hidden
            className="absolute inset-0 animate-pulse-glow rounded-full"
            style={{ boxShadow: "var(--glow-soft)" }}
          />
          <Logo className="relative w-full drop-shadow-[0_0_40px_color-mix(in_oklab,var(--primary)_45%,transparent)]" />
        </motion.div>
      </div>
    </section>
  );
}
