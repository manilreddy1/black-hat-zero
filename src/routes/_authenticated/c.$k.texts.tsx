import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { listSiteTexts, saveSiteTexts } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/c/$k/texts")({
  component: TextsPage,
});

type TextRow = {
  id: string;
  key: string;
  value: string;
  group_name: string;
  label: string;
  multiline: boolean;
  sort_order: number;
};

function TextsPage() {
  const load = useServerFn(listSiteTexts);
  const save = useServerFn(saveSiteTexts);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["site-texts"], queryFn: () => load() });
  const rows = (data ?? []) as TextRow[];
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rows.length) {
      setDraft(Object.fromEntries(rows.map((r) => [r.key, r.value])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const groups = useMemo(() => {
    const map = new Map<string, TextRow[]>();
    for (const r of rows) map.set(r.group_name, [...(map.get(r.group_name) ?? []), r]);
    return [...map.entries()];
  }, [rows]);

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          items: rows
            .filter((r) => draft[r.key] !== undefined && draft[r.key] !== r.value)
            .map((r) => ({ key: r.key, value: draft[r.key] ?? "" })),
        },
      }),
    onSuccess: () => {
      toast.success("Website copy updated.");
      qc.invalidateQueries({ queryKey: ["site-texts"] });
      qc.invalidateQueries({ queryKey: ["site-content"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const input = "w-full border border-input bg-surface px-3 py-2.5 font-mono text-xs";
  const dirty = rows.filter((r) => draft[r.key] !== undefined && draft[r.key] !== r.value).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// COPY</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-widest uppercase">
            Website text
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every headline, label and button caption on the public site.
          </p>
        </div>
        <button
          disabled={mutation.isPending || dirty === 0}
          onClick={() => mutation.mutate()}
          className="clip-notch bg-primary px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-50"
        >
          {mutation.isPending ? "SAVING..." : `[ Save ${dirty || ""} changes ]`}
        </button>
      </div>

      {groups.map(([group, items]) => (
        <div key={group} className="panel p-6">
          <p className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase">{group}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {items.map((r) => (
              <label key={r.key} className={r.multiline ? "block sm:col-span-2" : "block"}>
                <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  {r.label || r.key}
                </span>
                {r.multiline ? (
                  <textarea
                    rows={3}
                    value={draft[r.key] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [r.key]: e.target.value })}
                    className={`mt-2 ${input}`}
                  />
                ) : (
                  <input
                    value={draft[r.key] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [r.key]: e.target.value })}
                    className={`mt-2 ${input}`}
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
