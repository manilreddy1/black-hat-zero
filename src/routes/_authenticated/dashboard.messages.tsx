import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMessages } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/dashboard/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const fn = useServerFn(listMessages);
  const { data } = useQuery({ queryKey: ["messages"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// INBOX</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-widest uppercase">Messages</h1>
      </div>
      <div className="space-y-3">
        {(data ?? []).map((m) => (
          <div key={m.id} className="panel p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-mono text-xs text-primary">
                {m.name} · {m.email}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
            {m.subject && <p className="mt-2 font-display text-sm tracking-wide">{m.subject}</p>}
            <p className="mt-2 text-sm text-muted-foreground">{m.message}</p>
          </div>
        ))}
        {data?.length === 0 && (
          <p className="font-mono text-xs text-muted-foreground">NO MESSAGES YET.</p>
        )}
      </div>
    </div>
  );
}
