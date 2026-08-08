import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

export function BootLoader() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("bh0-booted")) {
      setDone(true);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      sessionStorage.setItem("bh0-booted", "1");
      setDone(true);
      return;
    }
    const id = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + Math.random() * 18 + 6);
        if (next >= 100) {
          clearInterval(id);
          setTimeout(() => {
            sessionStorage.setItem("bh0-booted", "1");
            setDone(true);
          }, 620);
        }
        return next;
      });
    }, 180);
    return () => clearInterval(id);
  }, []);

  const filled = Math.round(progress / 5);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-background scanlines"
        >
          <Logo className="h-28 w-28 animate-pulse-glow" />
          <div className="font-mono text-xs tracking-[0.4em] text-muted-foreground">
            INITIALIZING SYSTEM...
          </div>
          <div className="font-mono text-sm text-primary">
            [{"█".repeat(filled)}
            {"░".repeat(20 - filled)}] {Math.round(progress)}%
          </div>
          <div
            className={`font-mono text-xs tracking-[0.3em] ${progress >= 100 ? "text-ok" : "text-transparent"}`}
          >
            ACCESS GRANTED
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
