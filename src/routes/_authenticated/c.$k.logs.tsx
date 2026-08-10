import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLogs } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/c/$k/logs")({
  component: LogsPage,
});

function LogsPage() {
  const fn = useServerFn(listAuditLogs);
  const { data } = useQuery({ queryKey: ["audit-logs"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// TRACE</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-widest uppercase">
          Audit logs
        </h1>
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
            <tr>
              {["TIME", "ACTOR", "ROLE", "ACTION", "ENTITY", "META"].map((h) => (
                <th key={h} className="px-3 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((l) => (
              <tr key={l.id} className="border-b border-border/60">
                <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap">
                  {new Date(l.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 font-mono text-[11px]">{l.actor_email ?? l.actor_id ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-[11px]">{l.actor_role ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-[11px] text-primary">{l.action}</td>
                <td className="px-3 py-2 font-mono text-[11px]">{l.entity}</td>
                <td className="max-w-xs truncate px-3 py-2 font-mono text-[11px] text-muted-foreground">
                  {JSON.stringify(l.metadata ?? {})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
