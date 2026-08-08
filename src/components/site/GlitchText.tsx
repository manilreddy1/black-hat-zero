import { motion } from "framer-motion";

export function GlitchText({
  text,
  className = "",
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3";
}) {
  return (
    <Tag className={`relative inline-block ${className}`} data-text={text}>
      <span className="relative z-10">{text}</span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 translate-x-[2px] text-primary opacity-60 animate-glitch"
      >
        {text}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 -translate-x-[2px] text-muted-foreground opacity-40 animate-glitch"
      >
        {text}
      </span>
    </Tag>
  );
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
