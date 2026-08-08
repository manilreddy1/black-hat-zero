import { useEffect, useRef } from "react";

/** Canvas particle + binary rain field. Pauses when reduced motion is preferred. */
export function CyberBackground({ dense = false }: { dense?: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const columns: { x: number; y: number; speed: number; char: string }[] = [];
    const dots: { x: number; y: number; vx: number; vy: number; r: number }[] = [];

    function seed() {
      columns.length = 0;
      dots.length = 0;
      const colCount = Math.floor(w / (dense ? 26 : 42));
      for (let i = 0; i < colCount; i++) {
        columns.push({
          x: i * (dense ? 26 : 42) + 8,
          y: Math.random() * h,
          speed: 0.35 + Math.random() * 0.9,
          char: Math.random() > 0.5 ? "1" : "0",
        });
      }
      const dotCount = Math.min(70, Math.floor(w / 22));
      for (let i = 0; i < dotCount; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.6 + 0.4,
        });
      }
    }

    function resize() {
      const parent = canvas!.parentElement;
      w = parent?.clientWidth ?? window.innerWidth;
      h = parent?.clientHeight ?? window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function frame() {
      ctx!.clearRect(0, 0, w, h);
      ctx!.font = "12px 'JetBrains Mono', monospace";
      for (const c of columns) {
        ctx!.fillStyle = "rgba(220, 38, 38, 0.28)";
        ctx!.fillText(c.char, c.x, c.y);
        c.y += c.speed;
        if (c.y > h + 12) {
          c.y = -12;
          c.char = Math.random() > 0.5 ? "1" : "0";
        }
        if (Math.random() > 0.985) c.char = c.char === "1" ? "0" : "1";
      }
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(255,255,255,0.22)";
        ctx!.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    if (reduce) {
      ctx.font = "12px monospace";
    } else {
      raf = requestAnimationFrame(frame);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [dense]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
    />
  );
}
