import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

/** Only our own signed tokens are accepted from the camera. */
const CODE_RE = /^BH0-[AF]-[A-Za-z0-9._~-]{8,512}$/;

/** Short confirmation beep via WebAudio (no asset needed). */
function beep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => void ctx.close();
    navigator.vibrate?.(60);
  } catch {
    /* audio unavailable — silent */
  }
}

/**
 * Live camera QR scanner for staff check-in. Decodes frames locally in the
 * browser — nothing is uploaded — and fires onResult once, then the parent
 * closes the camera so the result can be reviewed.
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
  const doneRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;
    doneRef.current = false;
    setError(null);
    setReady(false);

    const stop = () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      const video = videoRef.current;
      if (video) video.srcObject = null;
    };

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!doneRef.current && video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (w && h) {
          // Sample only the centre square (the framed area) — faster and avoids
          // picking up unrelated codes at the edge of the shot.
          const side = Math.floor(Math.min(w, h) * 0.8);
          const sx = Math.floor((w - side) / 2);
          const sy = Math.floor((h - side) / 2);
          canvas.width = side;
          canvas.height = side;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, sx, sy, side, side, 0, 0, side, side);
            const img = ctx.getImageData(0, 0, side, side);
            const found = jsQR(img.data, side, side, { inversionAttempts: "dontInvert" });
            const value = found?.data?.trim();
            if (value && CODE_RE.test(value)) {
              doneRef.current = true;
              stop();
              beep();
              onResult(value);
              return;
            }
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
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
          setReady(true);
        }
        raf = requestAnimationFrame(tick);
      } catch {
        setError("Camera unavailable — allow camera access, or type the code manually.");
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [active, onResult]);

  if (!active) return null;

  return (
    <div className="panel space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] tracking-[0.3em] text-primary">
          {ready ? "LIVE CAMERA" : "STARTING CAMERA…"}
        </p>
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
        <div className="relative mx-auto aspect-square w-full max-w-[340px] overflow-hidden border border-border bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* framing mask + corner brackets */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.35)]" />
            <div className="absolute inset-[10%] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            <span className="absolute top-[10%] left-[10%] h-7 w-7 border-t-2 border-l-2 border-primary" />
            <span className="absolute top-[10%] right-[10%] h-7 w-7 border-t-2 border-r-2 border-primary" />
            <span className="absolute bottom-[10%] left-[10%] h-7 w-7 border-b-2 border-l-2 border-primary" />
            <span className="absolute right-[10%] bottom-[10%] h-7 w-7 border-r-2 border-b-2 border-primary" />
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <p className="text-center font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
        HOLD THE QR INSIDE THE FRAME — CAMERA STOPS AUTOMATICALLY ON A VALID CODE
      </p>
    </div>
  );
}
