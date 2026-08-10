import { SectionShell } from "@/components/site/SectionShell";
import { Reveal } from "@/components/site/GlitchText";

export function CustomSection({
  sectionKey,
  label,
  title,
  subtitle,
  body,
}: {
  sectionKey: string;
  label: string;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
}) {
  return (
    <SectionShell
      id={sectionKey}
      eyebrow={`// ${label.toUpperCase()}`}
      title={title || label}
      subtitle={subtitle ?? undefined}
    >
      {body ? (
        <Reveal>
          <div className="panel clip-notch space-y-4 p-6">
            {body.split(/\n{2,}/).map((para, i) => (
              <p key={i} className="text-sm whitespace-pre-line text-muted-foreground">
                {para}
              </p>
            ))}
          </div>
        </Reveal>
      ) : null}
    </SectionShell>
  );
}
