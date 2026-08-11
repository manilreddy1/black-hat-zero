import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

/**
 * Live camera QR scanner for staff check-in. Decodes frames locally in the
 * browser — nothing is uploaded — and fires onResult once per distinct code.
 */
export function QrScanner({
  active,
  onResult,
  onClose,
}: {
  active: boolean;
  onResult: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (w && h) {
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            const img = ctx.getImageData(0, 0, w, h);
            const found = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
            const value = found?.data?.trim();
            if (value) {
              const now = Date.now();
              if (value !== lastRef.current.code || now - lastRef.current.at > 3000) {
                lastRef.current = { code: value, at: now };
                onResult(value);
              }
            }
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        raf = requestAnimationFrame(tick);
      } catch {
        setError("Camera unavailable — allow camera access, or type the code manually.");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active, onResult]);

  if (!active) return null;

  return (
    <div className="panel space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-[0.3em] text-primary">LIVE CAMERA</p>
        <button
          onClick={onClose}
          className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase hover:text-primary"
        >
          [ Stop ]
        </button>
      </div>
      {error ? (
        <p className="font-mono text-xs text-destructive">{error}</p>
      ) : (
        <div className="relative mx-auto w-full max-w-sm overflow-hidden border border-border">
          <video ref={videoRef} playsInline muted className="block w-full" />
          <div className="pointer-events-none absolute inset-6 border-2 border-primary/70" />
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <p className="text-center font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
        POINT AT AN ATTENDANCE OR FOOD-TOKEN QR
      </p>
    </div>
  );
}
