import { useEffect, useRef } from "react";

/** Desktop-only red glow cursor. Disabled for touch and reduced-motion users. */
export function CustomCursor() {
  const dot = useRef<HTMLDivElement | null>(null);
  const ring = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let raf = 0;

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      const el = e.target as HTMLElement | null;
      const interactive = !!el?.closest("a,button,input,textarea,select,[role='button']");
      ring.current?.classList.toggle("scale-[1.9]", interactive);
      ring.current?.classList.toggle("opacity-90", interactive);
    };
    const loop = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${x - 3}px, ${y - 3}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx - 16}px, ${ry - 16}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    document.documentElement.style.cursor = "none";
    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      document.documentElement.style.cursor = "";
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100] hidden md:block">
      <div ref={dot} className="absolute h-1.5 w-1.5 rounded-full bg-primary" />
      <div
        ref={ring}
        className="absolute h-8 w-8 rounded-full border border-primary/70 opacity-50 transition-[transform,opacity] duration-200"
        style={{ boxShadow: "0 0 18px -2px var(--primary)" }}
      />
    </div>
  );
}
