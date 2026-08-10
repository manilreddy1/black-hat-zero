import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SectionShell } from "@/components/site/SectionShell";
import { Reveal } from "@/components/site/GlitchText";
import { getCertificateConfig } from "@/lib/certificates.functions";

export function CertificatesSection() {
  const config = useServerFn(getCertificateConfig);
  const { data } = useQuery({ queryKey: ["certificate-config"], queryFn: () => config() });
  if (!data?.is_enabled) return null;

  return (
    <SectionShell
      id="certificates"
      eyebrow="// CERTIFICATES"
      title={data.section_title}
      subtitle={data.section_subtitle}
    >
      <Reveal>
        <div className="panel clip-notch flex flex-col items-start gap-5 p-8">
          <p className="max-w-2xl text-sm text-muted-foreground">{data.note}</p>
          <Link
            to="/certificate"
            className="clip-notch bg-primary px-6 py-3 font-mono text-xs font-bold tracking-[0.2em] text-primary-foreground uppercase"
          >
            [ Get your certificate ]
          </Link>
        </div>
      </Reveal>
    </SectionShell>
  );
}
