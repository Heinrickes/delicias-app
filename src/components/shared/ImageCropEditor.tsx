"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Alto fijo del visor, igual al botón "Foto" (`h-28`) donde se muestra la imagen ya subida. */
const HEIGHT = 112;
const OUTPUT_W = 960;

function clamp(v: number, max: number) {
  return Math.min(max, Math.max(-max, v));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Editor de encuadre: permite arrastrar (pan) y hacer zoom —con la barra o
 * pellizcando con 2 dedos— sobre la imagen seleccionada antes de subirla.
 * El visor usa el mismo alto/ancho (`h-28 w-full`) que el botón "Foto" donde
 * la imagen se muestra después, para que el encuadre elegido acá sea
 * exactamente lo que se ve ahí (antes recortaba siempre a un cuadrado fijo,
 * distinto del espacio real donde se despliega la foto).
 */
export function ImageCropEditor({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [viewWidth, setViewWidth] = useState(320);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const panRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    setNatural(null);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setViewWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const containScale = natural ? Math.min(viewWidth / natural.w, HEIGHT / natural.h) : 1;
  const displayScale = containScale * scale;
  const maxOffsetX = natural ? Math.max(0, (natural.w * displayScale - viewWidth) / 2) : 0;
  const maxOffsetY = natural ? Math.max(0, (natural.h * displayScale - HEIGHT) / 2) : 0;
  const aspectSpread = natural ? Math.max(natural.w, natural.h) / Math.min(natural.w, natural.h) : 1;
  const maxScale = Math.max(3, aspectSpread * 2);

  const panFrom = (x: number, y: number) => {
    panRef.current = { startX: x, startY: y, origX: offset.x, origY: offset.y };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1) {
      panFrom(e.clientX, e.clientY);
    } else if (pointersRef.current.size === 2) {
      panRef.current = null;
      const [a, b] = Array.from(pointersRef.current.values());
      pinchRef.current = { dist: distance(a, b), scale };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const [a, b] = Array.from(pointersRef.current.values());
      const factor = distance(a, b) / pinchRef.current.dist;
      handleScale(Math.min(maxScale, Math.max(1, pinchRef.current.scale * factor)));
      return;
    }

    if (pointersRef.current.size === 1 && panRef.current) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setOffset({
        x: clamp(panRef.current.origX + dx, maxOffsetX),
        y: clamp(panRef.current.origY + dy, maxOffsetY),
      });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    pinchRef.current = null;
    if (pointersRef.current.size === 1) {
      const [pt] = Array.from(pointersRef.current.values());
      panFrom(pt.x, pt.y);
    } else {
      panRef.current = null;
    }
  };

  const handleScale = (next: number) => {
    setScale(next);
    if (!natural) return;
    const nextDisplayScale = containScale * next;
    const nextMaxX = Math.max(0, (natural.w * nextDisplayScale - viewWidth) / 2);
    const nextMaxY = Math.max(0, (natural.h * nextDisplayScale - HEIGHT) / 2);
    setOffset((o) => ({ x: clamp(o.x, nextMaxX), y: clamp(o.y, nextMaxY) }));
  };

  const handleConfirm = () => {
    if (!natural || !imgRef.current) return;
    const outputH = Math.round(OUTPUT_W * (HEIGHT / viewWidth));
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_W;
    canvas.height = outputH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT_W, outputH);
    const imgLeft = viewWidth / 2 - (natural.w * displayScale) / 2 + offset.x;
    const imgTop = HEIGHT / 2 - (natural.h * displayScale) / 2 + offset.y;
    const srcX = -imgLeft / displayScale;
    const srcY = -imgTop / displayScale;
    const srcW = viewWidth / displayScale;
    const srcH = HEIGHT / displayScale;
    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_W, outputH);
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.9
    );
  };

  if (!src) return null;

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative h-28 w-full touch-none select-none overflow-hidden rounded-xl bg-muted"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          onLoad={(e) => {
            const t = e.currentTarget;
            setNatural({ w: t.naturalWidth, h: t.naturalHeight });
          }}
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
          style={
            natural
              ? {
                  width: natural.w * displayScale,
                  height: natural.h * displayScale,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }
              : { opacity: 0 }
          }
        />
      </div>

      <div className="flex items-center gap-2 px-1">
        <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="range"
          min={1}
          max={maxScale}
          step={0.05}
          value={scale}
          onChange={(e) => handleScale(parseFloat(e.target.value))}
          className="w-full accent-primary"
          aria-label="Zoom"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-3.5 w-3.5" />
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={handleConfirm} disabled={!natural}>
          <Check className="h-3.5 w-3.5" />
          Usar foto
        </Button>
      </div>
    </div>
  );
}
