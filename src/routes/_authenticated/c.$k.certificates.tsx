import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getCertificateAdmin,
  saveCertificateSettings,
  uploadCertificateTemplate,
  type CertificateField,
} from "@/lib/certificates.functions";
import { resolveField } from "@/components/site/CertificateCanvas";
import {
  ALL_GOOGLE_FONTS,
  GOOGLE_FONT_GROUPS,
  SYSTEM_FONTS,
  ensureFontLoaded,
  fontStack,
} from "@/lib/certificate-fonts";

const isCustomFont = (f: string) => !SYSTEM_FONTS.includes(f) && !ALL_GOOGLE_FONTS.includes(f);


export const Route = createFileRoute("/_authenticated/c/$k/certificates")({
  component: CertificatesAdmin,
});

const SAMPLE: Record<string, string> = {
  name: "Participant Name",
  team: "Team Zero",
  college: "Your College",
  code: "BH0-2026-00001",
  event: "BLACK HAT ZERO '26",
  date: "2026-09-30",
};

const SOURCES: CertificateField["source"][] = [
  "name",
  "team",
  "college",
  "code",
  "event",
  "date",
  "custom",
];

function CertificatesAdmin() {
  const load = useServerFn(getCertificateAdmin);
  const save = useServerFn(saveCertificateSettings);
  const upload = useServerFn(uploadCertificateTemplate);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["certificate-admin"], queryFn: () => load() });

  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [note, setNote] = useState("");
  const [fields, setFields] = useState<CertificateField[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setEnabled(data.is_enabled);
    setTitle(data.section_title);
    setSubtitle(data.section_subtitle);
    setNote(data.note);
    setFields(data.fields);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          is_enabled: enabled,
          section_title: title,
          section_subtitle: subtitle,
          note,
          fields,
        },
      }),
    onSuccess: () => {
      toast.success("Certificate settings saved.");
      qc.invalidateQueries({ queryKey: ["certificate-admin"] });
      qc.invalidateQueries({ queryKey: ["certificate-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = () => rej(new Error("Could not read the file."));
        r.readAsDataURL(file);
      });
      return upload({ data: { name: file.name, type: file.type, base64 } });
    },
    onSuccess: () => {
      toast.success("Template uploaded.");
      qc.invalidateQueries({ queryKey: ["certificate-admin"] });
      qc.invalidateQueries({ queryKey: ["certificate-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = (id: string, patch: Partial<CertificateField>) =>
    setFields((f) => f.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const addField = () =>
    setFields((f) => [
      ...f,
      {
        id: `f${Date.now()}`,
        label: "New text",
        source: "custom" as const,
        text: "Text",
        x: 50,
        y: 50,
        size: 28,
        color: "#111111",
        weight: "400",
        align: "center" as const,
        font: "Playfair Display",
        fontUrl: "",
        letterSpacing: 0,
        italic: false,
        uppercase: false,
      },
    ]);

  const onStageMove = (e: React.MouseEvent) => {
    const id = dragging.current;
    const stage = stageRef.current;
    if (!id || !stage) return;
    const r = stage.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    update(id, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  };

  const input = "w-full border border-input bg-surface px-3 py-2 font-mono text-xs";
  const sel = fields.find((f) => f.id === selected) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// CERTIFICATES</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-widest uppercase">
          Participation certificates
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload a template, drag the text where it belongs, and switch the public section on when
          you are ready.
        </p>
      </div>

      <div className="panel grid gap-4 p-6 sm:grid-cols-2">
        <label className="flex items-center gap-3 sm:col-span-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase">
            Show certificate section on the website
          </span>
        </label>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            Section title
          </span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={`mt-2 ${input}`} />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            Section subtitle
          </span>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className={`mt-2 ${input}`}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            Note shown to participants
          </span>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`mt-2 ${input}`}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            Certificate template (PNG / JPG / WEBP, max 8 MB)
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadMutation.mutate(f);
            }}
            className={`mt-2 ${input}`}
          />
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div
          ref={stageRef}
          onMouseMove={onStageMove}
          onMouseUp={() => (dragging.current = null)}
          onMouseLeave={() => (dragging.current = null)}
          className="panel relative aspect-[1.414/1] w-full overflow-hidden select-none [container-type:inline-size]"
          style={
            data?.template_url
              ? {
                  backgroundImage: `url(${data.template_url})`,
                  backgroundSize: "100% 100%",
                }
              : undefined
          }
        >
          {!data?.template_url && (
            <p className="p-6 font-mono text-xs text-muted-foreground">
              Upload a template to position text on it.
            </p>
          )}
          {fields.map((f) => (
            <button
              key={f.id}
              onMouseDown={() => {
                dragging.current = f.id;
                setSelected(f.id);
              }}
              className={`absolute cursor-move whitespace-nowrap ${
                selected === f.id ? "outline outline-1 outline-primary" : ""
              }`}
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                transform: `translate(${
                  f.align === "center" ? "-50%" : f.align === "right" ? "-100%" : "0"
                }, -50%)`,
                color: f.color,
                fontFamily: f.font,
                fontWeight: Number(f.weight) || 400,
                fontSize: `${f.size / 14.14}cqw`,
              }}
            >
              {resolveField(f, SAMPLE) || f.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase">Fields</p>
            <button
              onClick={addField}
              className="border border-primary px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-primary uppercase"
            >
              + Add
            </button>
          </div>
          <div className="panel divide-y divide-border">
            {fields.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelected(f.id)}
                className={`flex w-full items-center justify-between p-3 text-left font-mono text-[11px] uppercase ${
                  selected === f.id ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span>{f.label}</span>
                <span>{f.source}</span>
              </button>
            ))}
            {fields.length === 0 && (
              <p className="p-3 font-mono text-[11px] text-muted-foreground">No text fields yet.</p>
            )}
          </div>

          {sel && (
            <div className="panel space-y-3 p-4">
              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  Label
                </span>
                <input
                  value={sel.label}
                  onChange={(e) => update(sel.id, { label: e.target.value })}
                  className={`mt-1 ${input}`}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  Content
                </span>
                <select
                  value={sel.source}
                  onChange={(e) =>
                    update(sel.id, { source: e.target.value as CertificateField["source"] })
                  }
                  className={`mt-1 ${input}`}
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              {sel.source === "custom" && (
                <label className="block">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                    Custom text
                  </span>
                  <input
                    value={sel.text}
                    onChange={(e) => update(sel.id, { text: e.target.value })}
                    className={`mt-1 ${input}`}
                  />
                </label>
              )}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">X %</span>
                  <input
                    type="number"
                    value={sel.x}
                    onChange={(e) => update(sel.id, { x: Number(e.target.value) })}
                    className={`mt-1 ${input}`}
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Y %</span>
                  <input
                    type="number"
                    value={sel.y}
                    onChange={(e) => update(sel.id, { y: Number(e.target.value) })}
                    className={`mt-1 ${input}`}
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    Size
                  </span>
                  <input
                    type="number"
                    value={sel.size}
                    onChange={(e) => update(sel.id, { size: Number(e.target.value) })}
                    className={`mt-1 ${input}`}
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    Colour
                  </span>
                  <input
                    type="color"
                    value={sel.color}
                    onChange={(e) => update(sel.id, { color: e.target.value })}
                    className="mt-1 h-9 w-full border border-input bg-surface"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    Weight
                  </span>
                  <select
                    value={sel.weight}
                    onChange={(e) => update(sel.id, { weight: e.target.value })}
                    className={`mt-1 ${input}`}
                  >
                    {["300", "400", "500", "600", "700", "800"].map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    Align
                  </span>
                  <select
                    value={sel.align}
                    onChange={(e) =>
                      update(sel.id, { align: e.target.value as CertificateField["align"] })
                    }
                    className={`mt-1 ${input}`}
                  >
                    {["left", "center", "right"].map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="col-span-2 block">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    Font family
                  </span>
                  <select
                    value={isCustomFont(sel.font) ? "__custom" : sel.font}
                    onChange={(e) =>
                      update(sel.id, {
                        font: e.target.value === "__custom" ? "My Custom Font" : e.target.value,
                        ...(e.target.value === "__custom" ? {} : { fontUrl: "" }),
                      })
                    }
                    className={`mt-1 ${input}`}
                    style={{ fontFamily: fontStack(sel.font) }}
                  >
                    <optgroup label="System">
                      {SYSTEM_FONTS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </optgroup>
                    {Object.entries(GOOGLE_FONT_GROUPS).map(([group, list]) => (
                      <optgroup key={group} label={group}>
                        {list.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <optgroup label="Custom">
                      <option value="__custom">Custom font…</option>
                    </optgroup>
                  </select>
                </label>
                {isCustomFont(sel.font) && (
                  <>
                    <label className="col-span-2 block">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Custom font family name
                      </span>
                      <input
                        value={sel.font}
                        onChange={(e) => update(sel.id, { font: e.target.value })}
                        placeholder="e.g. Great Vibes"
                        className={`mt-1 ${input}`}
                      />
                    </label>
                    <label className="col-span-2 block">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Font stylesheet URL (optional — leave blank for Google Fonts)
                      </span>
                      <input
                        value={sel.fontUrl ?? ""}
                        onChange={(e) => update(sel.id, { fontUrl: e.target.value })}
                        placeholder="https://fonts.googleapis.com/css2?family=..."
                        className={`mt-1 ${input}`}
                      />
                    </label>
                  </>
                )}
                <label className="block">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    Letter spacing
                  </span>
                  <input
                    type="number"
                    value={sel.letterSpacing ?? 0}
                    onChange={(e) => update(sel.id, { letterSpacing: Number(e.target.value) })}
                    className={`mt-1 ${input}`}
                  />
                </label>
                <label className="mt-6 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sel.italic ?? false}
                    onChange={(e) => update(sel.id, { italic: e.target.checked })}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    Italic
                  </span>
                </label>

                <label className="mt-6 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sel.uppercase}
                    onChange={(e) => update(sel.id, { uppercase: e.target.checked })}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    Uppercase
                  </span>
                </label>
              </div>
              <button
                onClick={() => {
                  setFields((f) => f.filter((x) => x.id !== sel.id));
                  setSelected(null);
                }}
                className="w-full border border-border py-2 font-mono text-[10px] tracking-[0.2em] text-primary uppercase"
              >
                Remove field
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        disabled={saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
        className="clip-notch bg-primary px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase disabled:opacity-60"
      >
        {saveMutation.isPending ? "SAVING..." : "[ Save certificate settings ]"}
      </button>
    </div>
  );
}
