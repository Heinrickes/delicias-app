"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const VIEW = 260;
const OUTPUT = 640;

function clamp(v: number, max: number) {
  return Math.min(max, Math.max(-max, v));
}

/**
 * Editor de encuadre: permite arrastrar (pan) y hacer zoom sobre la imagen
 * seleccionada antes de subirla. Al confirmar, renderiza el recorte visible
 * a un canvas cuadrado fijo y devuelve el resultado como Blob.
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
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    setNatural(null);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const containScale = natural ? Math.min(VIEW / natural.w, VIEW / natural.h) : 1;
  const displayScale = containScale * scale;
  const maxOffsetX = natural ? Math.max(0, (natural.w * displayScale - VIEW) / 2) : 0;
  const maxOffsetY = natural ? Math.max(0, (natural.h * displayScale - VIEW) / 2) : 0;
  const aspectSpread = natural ? Math.max(natural.w, natural.h) / Math.min(natural.w, natural.h) : 1;
  const maxScale = Math.max(3, aspectSpread * 2);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({
      x: clamp(dragRef.current.origX + dx, maxOffsetX),
      y: clamp(dragRef.current.origY + dy, maxOffsetY),
    });
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleScale = (next: number) => {
    setScale(next);
    if (!natural) return;
    const nextDisplayScale = containScale * next;
    const nextMaxX = Math.max(0, (natural.w * nextDisplayScale - VIEW) / 2);
    const nextMaxY = Math.max(0, (natural.h * nextDisplayScale - VIEW) / 2);
    setOffset((o) => ({ x: clamp(o.x, nextMaxX), y: clamp(o.y, nextMaxY) }));
  };

  const handleConfirm = () => {
    if (!natural || !imgRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    const imgLeft = VIEW / 2 - (natural.w * displayScale) / 2 + offset.x;
    const imgTop = VIEW / 2 - (natural.h * displayScale) / 2 + offset.y;
    const srcX = -imgLeft / displayScale;
    const srcY = -imgTop / displayScale;
    const srcW = VIEW / displayScale;
    const srcH = VIEW / displayScale;
    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, OUTPUT, OUTPUT);
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
        className="relative mx-auto touch-none select-none overflow-hidden rounded-xl bg-muted"
        style={{ width: VIEW, height: VIEW }}
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
