import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms / 3600000) % 24),
    minutes: Math.floor((ms / 60000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
    done: ms === 0,
  };
}

export function Countdown({ target }: { target: string }) {
  const targetMs = new Date(target).getTime();
  // Start from a stable value so SSR and hydration match, then tick on the client.
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, done: false });

  useEffect(() => {
    setT(diff(targetMs));
    const id = setInterval(() => setT(diff(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const cells = [
    { label: "DAYS", value: t.days },
    { label: "HRS", value: t.hours },
    { label: "MIN", value: t.minutes },
    { label: "SEC", value: t.seconds },
  ];

  return (
    <div className="flex items-stretch gap-2 sm:gap-3" role="timer" aria-label="Time until event">
      {cells.map((c) => (
        <div
          key={c.label}
          className="panel clip-notch min-w-[68px] px-3 py-2 text-center sm:min-w-[86px] sm:px-4 sm:py-3"
        >
          <div className="font-mono text-2xl font-bold tabular-nums text-foreground sm:text-4xl">
            {String(c.value).padStart(2, "0")}
          </div>
          <div className="mt-1 font-mono text-[10px] tracking-[0.25em] text-primary">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
