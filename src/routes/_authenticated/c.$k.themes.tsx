import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteContentRow,
  listContentRows,
  saveContentRow,
  updateEventSettings,
} from "@/lib/staff.functions";
import { siteContentQuery } from "@/hooks/useSiteContent";

export const Route = createFileRoute("/_authenticated/c/$k/themes")({
  component: ThemesPage,
});

type Row = Record<string, string | number | boolean | null>;

const BLANK: Row = {
  title: "",
  description: "",
  problem_statement: "",
  icon: "",
  sort_order: 0,
  is_published: true,
};

function ThemesPage() {
  const [editing, setEditing] = useState<Row | null>(null);
  const list = useServerFn(listContentRows);
  const save = useServerFn(saveContentRow);
  const remove = useServerFn(deleteContentRow);
  const saveSettings = useServerFn(updateEventSettings);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["content-rows", "challenges"],
    queryFn: () => list({ data: { table: "challenges" } }),
  });
  const rows = (data ?? []) as Row[];

  const { data: site } = useQuery(siteContentQuery);
  const revealed = Boolean(
    (site?.settings as { themes_revealed?: boolean } | undefined)?.themes_revealed,
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["content-rows", "challenges"] });
    qc.invalidateQueries({ queryKey: ["site-content"] });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          table: "challenges",
          id: (editing?.["id"] as string | undefined) ?? null,
          values: {
            title: editing?.["title"] ?? "",
            description: editing?.["description"] ?? "",
            problem_statement: editing?.["problem_statement"] ?? "",
            icon: editing?.["icon"] ?? "",
            sort_order: Number(editing?.["sort_order"] ?? 0),
            is_published: Boolean(editing?.["is_published"]),
          },
        },
      }),
    onSuccess: () => {
      toast.success("Theme saved.");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { table: "challenges", id } }),
    onSuccess: () => {
      toast.success("Theme deleted.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revealMutation = useMutation({
    mutationFn: (next: boolean) => saveSettings({ data: { themes_revealed: next } }),
    onSuccess: (_r, next) => {
      toast.success(next ? "Themes released to team leads." : "Themes hidden again.");
      qc.invalidateQueries({ queryKey: ["site-content"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const input = "w-full border border-input bg-surface px-3 py-2.5 font-mono text-xs";

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// THEMES</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-widest uppercase">
          Themes &amp; problem statements
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Titles and descriptions show on the public site. Problem statements are sealed and only
          appear in the team-lead portal once you release them.
        </p>
      </div>

      <div className="panel flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] text-primary">RELEASE STATUS</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {revealed
              ? "VISIBLE — team leads can read all problem statements."
              : "LOCKED — team leads see 'themes not released yet'."}
          </p>
        </div>
        <button
          disabled={revealMutation.isPending}
          onClick={() => revealMutation.mutate(!revealed)}
          className={`clip-notch px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] uppercase disabled:opacity-60 ${
            revealed
              ? "border border-border text-muted-foreground hover:border-primary hover:text-primary"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {revealMutation.isPending
            ? "SAVING..."
            : revealed
              ? "[ Hide from team leads ]"
              : "[ Show in team-lead portal ]"}
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setEditing({ ...BLANK, sort_order: rows.length })}
          className="clip-notch border border-primary px-5 py-2.5 font-mono text-[11px] tracking-[0.2em] text-primary uppercase"
        >
          [ + New theme ]
        </button>
      </div>

      {editing && (
        <div className="panel grid gap-4 p-6 sm:grid-cols-2">
          <p className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase sm:col-span-2">
            {editing["id"] ? "Edit theme" : "New theme"}
          </p>
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Title
            </span>
            <input
              value={String(editing["title"] ?? "")}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className={`mt-2 ${input}`}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Icon
            </span>
            <input
              value={String(editing["icon"] ?? "")}
              onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
              className={`mt-2 ${input}`}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Description (public)
            </span>
            <textarea
              rows={3}
              value={String(editing["description"] ?? "")}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className={`mt-2 ${input}`}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
              Problem statement (team leads only)
            </span>
            <textarea
              rows={6}
              value={String(editing["problem_statement"] ?? "")}
              onChange={(e) => setEditing({ ...editing, problem_statement: e.target.value })}
              className={`mt-2 ${input}`}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Order
            </span>
            <input
              type="number"
              value={Number(editing["sort_order"] ?? 0)}
              onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
              className={`mt-2 ${input}`}
            />
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(editing["is_published"])}
            onClick={() => setEditing({ ...editing, is_published: !editing["is_published"] })}
            className={`flex items-center justify-between gap-4 self-end border px-4 py-3 font-mono text-[11px] tracking-[0.15em] uppercase ${
              editing["is_published"] ? "border-primary/70" : "border-border text-muted-foreground"
            }`}
          >
            <span>Published on public site</span>
            <span
              className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
                editing["is_published"] ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${
                  editing["is_published"] ? "left-[22px]" : "left-0.5"
                }`}
              />
            </span>
          </button>
          <div className="flex gap-3 sm:col-span-2">
            <button
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="clip-notch bg-primary px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
            >
              {saveMutation.isPending ? "SAVING..." : "[ Save theme ]"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="clip-notch border border-border px-6 py-3 font-mono text-xs tracking-[0.2em] uppercase"
            >
              [ Cancel ]
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((r, i) => (
          <div key={String(r["id"])} className="panel p-5">
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
              THEME {String(i + 1).padStart(2, "0")} ·{" "}
              {r["is_published"] ? "PUBLISHED" : "HIDDEN"}
            </p>
            <h2 className="mt-2 font-display text-base font-bold tracking-widest uppercase">
              {String(r["title"] ?? "")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{String(r["description"] ?? "")}</p>
            <p className="mt-3 font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
              {r["problem_statement"] ? "Problem statement set" : "No problem statement yet"}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setEditing({ ...BLANK, ...r })}
                className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase"
              >
                [ Edit ]
              </button>
              <button
                onClick={() => {
                  if (confirm("Delete this theme?")) deleteMutation.mutate(String(r["id"]));
                }}
                className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase hover:text-destructive"
              >
                [ Delete ]
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
