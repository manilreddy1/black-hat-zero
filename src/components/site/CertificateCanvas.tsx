import { useEffect, useRef } from "react";
import type { CertificateField } from "@/lib/certificates.functions";

export type CertificateValues = Record<string, string>;

export function resolveField(f: CertificateField, values: CertificateValues) {
  const raw = f.source === "custom" ? f.text : (values[f.source] ?? "");
  return f.uppercase ? raw.toUpperCase() : raw;
}

/**
 * Renders the certificate template with the positioned text onto a canvas.
 * Coordinates are stored as percentages so any template resolution works.
 */
export function CertificateCanvas({
  templateUrl,
  fields,
  values,
  onReady,
  className = "",
}: {
  templateUrl: string;
  fields: CertificateField[];
  values: CertificateValues;
  onReady?: (canvas: HTMLCanvasElement) => void;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const scale = img.naturalHeight / 1000;
      for (const f of fields) {
        const text = resolveField(f, values);
        if (!text) continue;
        ctx.font = `${f.weight} ${Math.round(f.size * scale)}px ${f.font}`;
        ctx.fillStyle = f.color;
        ctx.textAlign = f.align;
        ctx.textBaseline = "middle";
        ctx.fillText(text, (f.x / 100) * canvas.width, (f.y / 100) * canvas.height);
      }
      onReady?.(canvas);
    };
    img.src = templateUrl;
    return () => {
      cancelled = true;
    };
  }, [templateUrl, fields, values, onReady]);

  return <canvas ref={ref} className={`h-auto w-full ${className}`} />;
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
