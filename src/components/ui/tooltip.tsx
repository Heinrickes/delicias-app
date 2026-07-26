"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const GAP = 8;
const EDGE_PADDING = 8;

function computeCoords(
  triggerRect: DOMRect,
  pillRect: DOMRect,
  preferredSide: "top" | "bottom"
) {
  const spaceAbove = triggerRect.top;
  const spaceBelow = window.innerHeight - triggerRect.bottom;
  let side = preferredSide;
  if (side === "top" && spaceAbove < pillRect.height + GAP && spaceBelow > spaceAbove) {
    side = "bottom";
  } else if (side === "bottom" && spaceBelow < pillRect.height + GAP && spaceAbove > spaceBelow) {
    side = "top";
  }

  const top =
    side === "top"
      ? triggerRect.top - pillRect.height - GAP
      : triggerRect.bottom + GAP;

  const rawLeft = triggerRect.left + triggerRect.width / 2 - pillRect.width / 2;
  const maxLeft = Math.max(window.innerWidth - pillRect.width - EDGE_PADDING, EDGE_PADDING);
  const left = Math.min(Math.max(rawLeft, EDGE_PADDING), maxLeft);

  return { top, left };
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T) => {
    for (const r of refs) {
      if (typeof r === "function") r(node);
      else if (r) (r as React.MutableRefObject<T | null>).current = node;
    }
  };
}

/**
 * Tooltip con píldora portada a `document.body` — misma apariencia visual
 * en toda la app, pero al vivir fuera del árbol del trigger nunca queda
 * recortada por el `overflow-y:auto` de un modal/contenedor con scroll
 * (a diferencia de un tooltip puramente CSS posicionado con `absolute`).
 * Reenvía `ref` y props extra al `<span>` envoltorio.
 */
export const Tooltip = forwardRef<
  HTMLSpanElement,
  {
    content: string;
    children: ReactNode;
    className?: string;
    /** Lado preferido. Si no hay espacio (cerca del borde de la ventana), se voltea automáticamente. */
    side?: "bottom" | "top";
  } & React.HTMLAttributes<HTMLSpanElement>
>(function Tooltip(
  { content, children, className, side = "bottom", onMouseEnter, onMouseLeave, onFocus, onBlur, ...rest },
  ref
) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: -9999, left: -9999 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => setMounted(true), []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const pill = pillRef.current;
    if (!trigger || !pill) return;
    setCoords(computeCoords(trigger.getBoundingClientRect(), pill.getBoundingClientRect(), side));
  }, [side]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  return (
    <span
      ref={mergeRefs(triggerRef, ref)}
      className={cn("inline-flex", className)}
      onMouseEnter={(e) => { onMouseEnter?.(e); show(); }}
      onMouseLeave={(e) => { onMouseLeave?.(e); hide(); }}
      onFocus={(e) => {
        onFocus?.(e);
        // Solo mostrar en foco real por teclado (Tab), no cuando un
        // popover/modal recién abierto enfoca su primer botón por su cuenta.
        if (e.target instanceof HTMLElement && e.target.matches(":focus-visible")) show();
      }}
      onBlur={(e) => { onBlur?.(e); hide(); }}
      {...rest}
    >
      {children}
      {mounted &&
        createPortal(
          <span
            ref={pillRef}
            style={{ position: "fixed", top: coords.top, left: coords.left }}
            className={cn(
              "pointer-events-none z-[100] whitespace-nowrap rounded-lg border bg-card px-2.5 py-1 text-[11px] font-semibold tracking-wide text-foreground shadow-lg transition-opacity duration-150",
              open ? "opacity-100" : "opacity-0"
            )}
          >
            {content}
          </span>,
          document.body
        )}
    </span>
  );
});
