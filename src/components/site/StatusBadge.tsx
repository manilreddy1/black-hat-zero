import { STATUS_LABELS, STATUS_TONE } from "@/lib/constants";

const TONE: Record<string, string> = {
  neutral: "border-border text-muted-foreground bg-surface-2",
  warn: "border-warn/50 text-warn bg-warn/10",
  ok: "border-ok/50 text-ok bg-ok/10",
  danger: "border-primary/60 text-primary bg-primary/10",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE[STATUS_TONE[status] ?? "neutral"]!;
  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 font-mono text-[11px] tracking-wider uppercase ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
