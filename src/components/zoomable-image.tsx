import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const MIN = 1;
const MAX = 6;

export function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const stateRef = useRef({ zoom, offset });
  stateRef.current = { zoom, offset };
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { zoom: z, offset: o } = stateRef.current;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const next = Math.min(MAX, Math.max(MIN, z * Math.exp(-dy * 0.0015)));
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const k = next / z;
      setZoom(next);
      setOffset({ x: px - (px - o.x) * k, y: py - (py - o.y) * k });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function zoomAtCenter(factor: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = rect.width / 2;
    const py = rect.height / 2;
    const next = Math.min(MAX, Math.max(MIN, zoom * factor));
    const k = next / zoom;
    setZoom(next);
    setOffset({ x: px - (px - offset.x) * k, y: py - (py - offset.y) * k });
  }

  return (
    <div className="relative overflow-hidden rounded-lg border bg-muted">
      <div
        ref={containerRef}
        className="h-[28rem] w-full cursor-grab lg:h-[44rem] touch-none active:cursor-grabbing"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="h-full w-full select-none object-contain"
          style={{
            transformOrigin: "0 0",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        />
      </div>
      <div className="absolute bottom-3 right-3 flex gap-1 rounded-md border bg-card p-1 shadow-sm">
        <Button size="icon" variant="ghost" aria-label="Zoom in" onClick={() => zoomAtCenter(1.3)}>
          <ZoomIn className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Zoom out"
          onClick={() => zoomAtCenter(1 / 1.3)}
        >
          <ZoomOut className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Reset zoom"
          onClick={() => {
            setZoom(1);
            setOffset({ x: 0, y: 0 });
          }}
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>
    </div>
  );
}
