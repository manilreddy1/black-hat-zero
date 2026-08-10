import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { deleteContentRow, listContentRows, saveContentRow } from "@/lib/staff.functions";
import { CONTENT_TABLES } from "@/lib/schemas";

export const Route = createFileRoute("/_authenticated/c/$k/content")({
  component: ContentPage,
});

type Field = { name: string; label: string; type: "text" | "textarea" | "number" | "bool" };

const CONFIG: Record<
  (typeof CONTENT_TABLES)[number],
  { label: string; fields: Field[]; titleField: string }
> = {
  challenges: {
    label: "Challenge tracks",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "icon", label: "Icon", type: "text" },
      { name: "sort_order", label: "Order", type: "number" },
      { name: "is_published", label: "Published", type: "bool" },
    ],
  },
  timeline_items: {
    label: "Timeline",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "happens_at", label: "Time label", type: "text" },
      { name: "sort_order", label: "Order", type: "number" },
      { name: "is_published", label: "Published", type: "bool" },
    ],
  },
  prizes: {
    label: "Prizes",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "amount", label: "Amount", type: "text" },
      { name: "tier", label: "Tier", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "sort_order", label: "Order", type: "number" },
      { name: "is_published", label: "Published", type: "bool" },
    ],
  },
  rules: {
    label: "Rules",
    titleField: "category",
    fields: [
      { name: "category", label: "Category", type: "text" },
      { name: "content", label: "Content", type: "textarea" },
      { name: "sort_order", label: "Order", type: "number" },
      { name: "is_published", label: "Published", type: "bool" },
    ],
  },
  faqs: {
    label: "FAQs",
    titleField: "question",
    fields: [
      { name: "question", label: "Question", type: "text" },
      { name: "answer", label: "Answer", type: "textarea" },
      { name: "sort_order", label: "Order", type: "number" },
      { name: "is_published", label: "Published", type: "bool" },
    ],
  },
  sponsors: {
    label: "Sponsors",
    titleField: "name",
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "tier", label: "Tier", type: "text" },
      { name: "logo_url", label: "Logo URL", type: "text" },
      { name: "website", label: "Website", type: "text" },
      { name: "sort_order", label: "Order", type: "number" },
      { name: "is_published", label: "Published", type: "bool" },
    ],
  },
  page_sections: {
    label: "Page sections",
    titleField: "label",
    fields: [
      { name: "label", label: "Section name", type: "text" },
      { name: "key", label: "Key (builtin: hero/about/event/challenges/timeline/rules/prizes/sponsors/faq/contact)", type: "text" },
      { name: "kind", label: "Kind (builtin or custom)", type: "text" },
      { name: "title", label: "Title (custom only)", type: "text" },
      { name: "subtitle", label: "Subtitle (custom only)", type: "text" },
      { name: "body", label: "Body (custom only)", type: "textarea" },
      { name: "sort_order", label: "Order", type: "number" },
      { name: "is_visible", label: "Visible", type: "bool" },
    ],
  },
  nav_items: {
    label: "Navigation menu",
    titleField: "label",
    fields: [
      { name: "label", label: "Label", type: "text" },
      { name: "href", label: "Link (e.g. /about or /p/my-page or https://...)", type: "text" },
      { name: "sort_order", label: "Order", type: "number" },
      { name: "is_button", label: "Show as button", type: "bool" },
      { name: "new_tab", label: "Open in new tab", type: "bool" },
      { name: "is_visible", label: "Visible", type: "bool" },
    ],
  },
  custom_pages: {
    label: "Pages",
    titleField: "title",
    fields: [
      { name: "title", label: "Page title", type: "text" },
      { name: "slug", label: "URL slug (page opens at /p/slug)", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "seo_description", label: "SEO description", type: "text" },
      { name: "sort_order", label: "Order", type: "number" },
      { name: "is_published", label: "Published", type: "bool" },
    ],
  },
  announcements: {
    label: "Announcements",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "is_published", label: "Published", type: "bool" },
    ],
  },
};

type Row = Record<string, string | number | boolean | null>;

function ContentPage() {
  const [table, setTable] = useState<(typeof CONTENT_TABLES)[number]>("challenges");
  const [editing, setEditing] = useState<Row | null>(null);
  const list = useServerFn(listContentRows);
  const save = useServerFn(saveContentRow);
  const remove = useServerFn(deleteContentRow);
  const qc = useQueryClient();
  const cfg = CONFIG[table];

  const { data } = useQuery({
    queryKey: ["content-rows", table],
    queryFn: () => list({ data: { table } }),
  });
  const rows = (data ?? []) as Row[];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["content-rows", table] });
    qc.invalidateQueries({ queryKey: ["site-content"] });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const values: Record<string, unknown> = {};
      for (const f of cfg.fields) values[f.name] = editing?.[f.name] ?? (f.type === "bool" ? false : f.type === "number" ? 0 : "");
      return save({
        data: { table, id: (editing?.["id"] as string | undefined) ?? null, values },
      });
    },
    onSuccess: () => {
      toast.success("Saved.");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { table, id } }),
    onSuccess: () => {
      toast.success("Deleted.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const input = "w-full border border-input bg-surface px-3 py-2.5 font-mono text-xs";

  const blank = () => {
    const r: Row = {};
    for (const f of cfg.fields)
      r[f.name] = f.type === "bool" ? true : f.type === "number" ? rows.length : "";
    return r;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// CONTENT</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-widest uppercase">
          Site content
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add, edit, reorder or unpublish anything shown on the public pages.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONTENT_TABLES.map((tbl) => (
          <button
            key={tbl}
            onClick={() => {
              setTable(tbl);
              setEditing(null);
            }}
            className={`px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase ${
              tbl === table
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {CONFIG[tbl].label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <a
          href="/?preview=1"
          target="_blank"
          rel="noopener noreferrer"
          className="clip-notch border border-border px-5 py-2.5 font-mono text-[11px] tracking-[0.2em] uppercase hover:border-primary hover:text-primary"
        >
          [ Live preview ]
        </a>
        <button
          onClick={() => setEditing(blank())}
          className="clip-notch border border-primary px-5 py-2.5 font-mono text-[11px] tracking-[0.2em] text-primary uppercase"
        >
          [ + New entry ]
        </button>
      </div>


      {editing && (
        <div className="panel grid gap-4 p-6 sm:grid-cols-2">
          <p className="sm:col-span-2 font-mono text-[11px] tracking-[0.3em] text-primary uppercase">
            {editing["id"] ? "Edit entry" : "New entry"}
          </p>
          {cfg.fields.map((f) => (
            <label
              key={f.name}
              className={f.type === "textarea" ? "block sm:col-span-2" : "block"}
            >
              <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                {f.label}
              </span>
              {f.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={String(editing[f.name] ?? "")}
                  onChange={(e) => setEditing({ ...editing, [f.name]: e.target.value })}
                  className={`mt-2 ${input}`}
                />
              ) : f.type === "bool" ? (
                <div className="mt-3">
                  <input
                    type="checkbox"
                    checked={Boolean(editing[f.name])}
                    onChange={(e) => setEditing({ ...editing, [f.name]: e.target.checked })}
                  />
                </div>
              ) : (
                <input
                  type={f.type === "number" ? "number" : "text"}
                  value={String(editing[f.name] ?? "")}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value,
                    })
                  }
                  className={`mt-2 ${input}`}
                />
              )}
            </label>
          ))}
          <div className="flex gap-3 sm:col-span-2">
            <button
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="clip-notch bg-primary px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
            >
              {saveMutation.isPending ? "SAVING..." : "[ Save ]"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="border border-border px-6 py-3 font-mono text-xs tracking-[0.2em] uppercase"
            >
              [ Cancel ]
            </button>
          </div>
        </div>
      )}

      <div className="panel divide-y divide-border">
        {rows.length === 0 && (
          <p className="p-6 font-mono text-xs text-muted-foreground">No entries yet.</p>
        )}
        {rows.map((r) => (
          <div key={String(r["id"])} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold tracking-wide">
                {String(r[cfg.titleField] ?? "—")}
              </p>
              <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                {r["is_published"] === false ? "HIDDEN" : "PUBLISHED"}
                {"sort_order" in r ? ` · ORDER ${String(r["sort_order"])}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setEditing(r)}
                className="border border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] uppercase hover:border-primary hover:text-primary"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm("Delete this entry?")) deleteMutation.mutate(String(r["id"]));
                }}
                className="border border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-primary uppercase hover:border-primary"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
