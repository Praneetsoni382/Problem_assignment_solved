import { useEffect, useRef, useState } from "react";
import { RefreshCw, Check, X, ScanLine, Crop, Aperture } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  detectDocumentQuad,
  enhanceScan,
  scanDocument,
  warpQuad,
  type Quad,
} from "@/lib/document-scan";

type Props = {
  open: boolean;
  questionNo: number;
  onClose: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
};

type Preview = { url: string; blob: Blob; cropped: boolean };

export function CameraCapture({ open, questionNo, onClose, onConfirm }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pageInFrame, setPageInFrame] = useState(false);

  useEffect(() => {
    if (!open || preview) return;
    let cancelled = false;

    async function start() {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1440 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch (err) {
        const name = (err as { name?: string })?.name;
        setError(
          name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access in your browser settings, then retry."
            : name === "NotFoundError"
              ? "No camera was found on this device."
              : "Could not open the camera. Please retry.",
        );
      }
    }

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, preview, attempt]);

  // Live page-edge detection overlay so the student can frame the sheet.
  useEffect(() => {
    if (!open || preview || error) return;
    let timer: number | undefined;

    function tick() {
      const video = videoRef.current;
      const overlay = overlayRef.current;
      if (video && overlay && video.videoWidth) {
        const rect = video.getBoundingClientRect();
        overlay.width = Math.round(rect.width);
        overlay.height = Math.round(rect.height);
        const ctx = overlay.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, overlay.width, overlay.height);
          const quad = detectDocumentQuad(video, video.videoWidth, video.videoHeight);
          setPageInFrame(!!quad);
          if (quad) {
            // Video is object-cover: map source coords to the visible box.
            const scale = Math.max(
              overlay.width / video.videoWidth,
              overlay.height / video.videoHeight,
            );
            const offsetX = (overlay.width - video.videoWidth * scale) / 2;
            const offsetY = (overlay.height - video.videoHeight * scale) / 2;
            ctx.beginPath();
            quad.forEach((p, i) => {
              const x = p.x * scale + offsetX;
              const y = p.y * scale + offsetY;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.strokeStyle = "rgba(13, 92, 82, 0.95)";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = "rgba(13, 92, 82, 0.12)";
            ctx.fill();
          }
        }
      }
      timer = window.setTimeout(tick, 450);
    }

    timer = window.setTimeout(tick, 300);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [open, preview, error]);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setError(null);
      setBusy(false);
      setPageInFrame(false);
    }
  }, [open]);

  if (!open) return null;

  function toPreview(canvas: HTMLCanvasElement, cropped: boolean) {
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setPreview({ url: URL.createObjectURL(blob), blob, cropped });
      },
      "image/jpeg",
      0.92,
    );
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Keep a copy of the raw frame
    const raw = document.createElement("canvas");
    raw.width = canvas.width;
    raw.height = canvas.height;
    raw.getContext("2d")?.drawImage(canvas, 0, 0);
    frameRef.current = raw;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const { canvas: scanned, cropped } = scanDocument(canvas);
    toPreview(scanned, cropped);
  }

  function recrop() {
    const raw = frameRef.current;
    if (!raw) return;
    if (preview) URL.revokeObjectURL(preview.url);
    if (preview?.cropped) {
      // Fall back to the whole frame
      const full = document.createElement("canvas");
      full.width = raw.width;
      full.height = raw.height;
      full.getContext("2d")?.drawImage(raw, 0, 0);
      toPreview(enhanceScan(full), false);
      return;
    }
    const copy = document.createElement("canvas");
    copy.width = raw.width;
    copy.height = raw.height;
    copy.getContext("2d", { willReadFrequently: true })?.drawImage(raw, 0, 0);
    const quad: Quad | null = detectDocumentQuad(copy, copy.width, copy.height);
    const warped = quad ? warpQuad(copy, quad) : null;
    if (warped) toPreview(enhanceScan(warped), true);
    else toPreview(enhanceScan(copy), false);
  }

  function retake() {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  async function use() {
    if (!preview) return;
    setBusy(true);
    try {
      await onConfirm(preview.blob);
      URL.revokeObjectURL(preview.url);
      setPreview(null);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6">
      {/* Modal Container corresponding to Image 1 */}
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-[#e8eceb] shadow-2xl transition-all duration-300 dark:bg-card">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              Question {questionNo} Scanner
            </h3>
            <p className="text-xs text-muted-foreground">Frame handwritten page inside brackets</p>
          </div>
          <button
            type="button"
            aria-label="Close camera"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-black/5 text-foreground transition hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Viewport Frame */}
        <div className="relative mx-4 my-2 aspect-[3/4] max-h-[58vh] overflow-hidden rounded-2xl bg-black shadow-inner sm:mx-6">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-white">
              <p className="max-w-xs text-sm">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAttempt((a) => a + 1)}
                className="rounded-full"
              >
                <RefreshCw className="mr-2 size-4" /> Retry camera
              </Button>
            </div>
          ) : preview ? (
            <img
              src={preview.url}
              alt="Scanned answer page"
              className="h-full w-full object-contain bg-neutral-900"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="h-full w-full object-cover"
              />
              <canvas
                ref={overlayRef}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />

              {/* Scanning Framing Overlay & Corner Brackets */}
              <div className="pointer-events-none absolute inset-4 border border-white/25 sm:inset-6">
                {/* 4 Corner brackets */}
                <div className="absolute -left-1 -top-1 size-6 border-l-4 border-t-4 border-white shadow-sm" />
                <div className="absolute -right-1 -top-1 size-6 border-r-4 border-t-4 border-white shadow-sm" />
                <div className="absolute -bottom-1 -left-1 size-6 border-b-4 border-l-4 border-white shadow-sm" />
                <div className="absolute -bottom-1 -right-1 size-6 border-b-4 border-r-4 border-white shadow-sm" />

                {/* Subtle rule of thirds lines */}
                <div className="absolute inset-x-0 top-1/3 border-b border-white/15 border-dashed" />
                <div className="absolute inset-x-0 top-2/3 border-b border-white/15 border-dashed" />
                <div className="absolute inset-y-0 left-1/3 border-r border-white/15 border-dashed" />
                <div className="absolute inset-y-0 left-2/3 border-r border-white/15 border-dashed" />
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />

          {/* Status Chip */}
          {!error && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
              <span className="flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-[11px] font-medium text-white shadow-md backdrop-blur-md">
                <ScanLine className="size-3 text-emerald-400" />
                {preview
                  ? preview.cropped
                    ? "Page detected & optimized"
                    : "Full frame capture"
                  : pageInFrame
                    ? "Page detected — ready"
                    : "Align paper inside frame"}
              </span>
            </div>
          )}
        </div>

        {/* Shutter & Controls Bottom Bar as in Image 1 */}
        <div className="flex items-center justify-between px-6 py-4 sm:px-8">
          {preview ? (
            <>
              <button
                type="button"
                onClick={retake}
                disabled={busy}
                className="text-sm font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-50"
              >
                Retake
              </button>

              <button
                type="button"
                onClick={recrop}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-accent disabled:opacity-50"
              >
                <Crop className="size-3.5 text-muted-foreground" />
                {preview.cropped ? "Full view" : "Auto-crop"}
              </button>

              <button
                type="button"
                onClick={use}
                disabled={busy}
                className="flex items-center gap-1.5 text-sm font-bold text-[#0d5c52] transition hover:text-[#09423b] disabled:opacity-50 dark:text-emerald-400"
              >
                {busy ? "Saving…" : "Use This Photo"}
                <Check className="size-4" />
              </button>
            </>
          ) : (
            !error && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                >
                  Cancel
                </button>

                {/* Shutter Aperture Button (from Image 1) */}
                <button
                  type="button"
                  onClick={capture}
                  aria-label="Capture photo"
                  className="group relative flex size-18 items-center justify-center rounded-full border-4 border-slate-300 bg-gradient-to-b from-slate-100 to-slate-200 shadow-lg transition-transform active:scale-90 dark:border-slate-600 dark:from-slate-700 dark:to-slate-800 sm:size-20"
                >
                  <div className="flex size-14 items-center justify-center rounded-full bg-white shadow-inner transition group-hover:scale-95 dark:bg-slate-900">
                    <Aperture className="size-8 text-slate-700 transition group-hover:rotate-45 dark:text-slate-200" />
                  </div>
                </button>

                <div className="w-12 text-right">
                  <span className="text-xs text-muted-foreground font-medium">Q{questionNo}</span>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
