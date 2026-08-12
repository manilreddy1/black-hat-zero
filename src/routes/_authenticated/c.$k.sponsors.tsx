import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { deleteContentRow, listContentRows, saveContentRow } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/c/$k/sponsors")({
  component: SponsorsPage,
});

type Row = {
  id?: string;
  name: string;
  tier: string;
  logo_url: string;
  website: string;
  sort_order: number;
  is_published: boolean;
};

const blank = (order: number): Row => ({
  name: "",
  tier: "Partners",
  logo_url: "",
  website: "",
  sort_order: order,
  is_published: true,
});

function SponsorsPage() {
  const [editing, setEditing] = useState<Row | null>(null);
  const list = useServerFn(listContentRows);
  const save = useServerFn(saveContentRow);
  const remove = useServerFn(deleteContentRow);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["content-rows", "sponsors"],
    queryFn: () => list({ data: { table: "sponsors" } }),
  });
  const rows = ((data ?? []) as unknown as Row[]).slice().sort((a, b) => a.sort_order - b.sort_order);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["content-rows", "sponsors"] });
    qc.invalidateQueries({ queryKey: ["site-content"] });
  };

  const saveMutation = useMutation({
    mutationFn: (row: Row) =>
      save({
        data: {
          table: "sponsors",
          id: row.id ?? null,
          values: {
            name: row.name.trim(),
            tier: row.tier.trim() || "Partners",
            logo_url: row.logo_url.trim(),
            website: row.website.trim(),
            sort_order: Number(row.sort_order) || 0,
            is_published: row.is_published,
          },
        },
      }),
    onSuccess: () => {
      toast.success("Saved.");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { table: "sponsors", id } }),
    onSuccess: () => {
      toast.success("Removed.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const input = "w-full border border-input bg-surface px-3 py-2.5 font-mono text-xs";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// SPONSORS</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-widest uppercase">
            Sponsors &amp; partners
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Logos scroll horizontally on the public site, grouped by tier.
          </p>
        </div>
        <button
          onClick={() => setEditing(blank(rows.length + 1))}
          className="shrink-0 bg-primary px-4 py-2 font-mono text-[11px] tracking-[0.2em] text-primary-foreground uppercase"
        >
          [ Add ]
        </button>
      </div>

      {editing && (
        <div className="panel space-y-4 p-5">
          <p className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase">
            {editing.id ? "Edit sponsor" : "New sponsor"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase">Name</span>
              <input
                className={input}
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase">
                Tier / group heading
              </span>
              <input
                className={input}
                value={editing.tier}
                onChange={(e) => setEditing({ ...editing, tier: e.target.value })}
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase">Logo URL</span>
              <input
                className={input}
                value={editing.logo_url}
                onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase">Website</span>
              <input
                className={input}
                value={editing.website}
                onChange={(e) => setEditing({ ...editing, website: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase">Order</span>
              <input
                type="number"
                className={input}
                value={editing.sort_order}
                onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
              />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={editing.is_published}
              onClick={() => setEditing({ ...editing, is_published: !editing.is_published })}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                editing.is_published ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${
                  editing.is_published ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase">Published</span>
          </div>

          {editing.logo_url && (
            <div className="panel flex h-28 w-52 items-center justify-center p-4">
              <img
                src={editing.logo_url}
                alt="Logo preview"
                className="max-h-16 max-w-full object-contain"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => saveMutation.mutate(editing)}
              disabled={saveMutation.isPending || !editing.name.trim()}
              className="bg-primary px-4 py-2 font-mono text-[11px] tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-50"
            >
              [ Save ]
            </button>
            <button
              onClick={() => setEditing(null)}
              className="border border-border px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase"
            >
              [ Cancel ]
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((s) => (
          <div key={s.id} className="panel space-y-3 p-4">
            <div className="flex h-24 items-center justify-center border border-border bg-surface/50 p-3">
              {s.logo_url ? (
                <img
                  src={s.logo_url}
                  alt={`${s.name} logo`}
                  className="max-h-16 max-w-full object-contain"
                />
              ) : (
                <span className="font-display text-sm tracking-widest">{s.name}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold tracking-widest uppercase">
                {s.name}
              </p>
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                {s.tier} · #{s.sort_order} · {s.is_published ? "live" : "hidden"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing({ ...s })}
                className="border border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] uppercase hover:border-primary hover:text-primary"
              >
                Edit
              </button>
              <button
                onClick={() => s.id && deleteMutation.mutate(s.id)}
                className="border border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-destructive uppercase hover:border-destructive"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No sponsors yet.</p>
        )}
      </div>
    </div>
  );
}
