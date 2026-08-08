import { useEffect, useState } from "react";

const DEFAULT_LINES = [
  "> booting_black_hat.sh",
  "> initializing security protocols...",
  "> loading challenge environment...",
  "> registration system online",
  "> access granted_",
];

export function TerminalPanel({
  lines = DEFAULT_LINES,
  title = "root@blackhat0:~",
  className = "",
}: {
  lines?: string[];
  title?: string;
  className?: string;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= lines.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), 520);
    return () => clearTimeout(id);
  }, [shown, lines.length]);

  return (
    <div className={`panel clip-notch scanlines overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">{title}</span>
      </div>
      <div className="space-y-1 p-4 font-mono text-xs leading-relaxed sm:text-sm">
        {lines.slice(0, shown).map((l, i) => (
          <p key={i} className={i === lines.length - 1 ? "text-primary" : "text-muted-foreground"}>
            {l}
          </p>
        ))}
        <span className="inline-block h-4 w-2 translate-y-0.5 bg-primary animate-blink" />
      </div>
    </div>
  );
}
