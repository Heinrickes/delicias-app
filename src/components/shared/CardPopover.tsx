"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type CardPopoverField = { label: string; value: ReactNode };

export function CardPopover({
  imageUrl,
  placeholder,
  badge,
  title,
  keyValue,
  fields,
  author,
  actions,
  children,
  className,
  layout = "grid",
}: {
  /** URL de la foto. Si es null/undefined se muestra `placeholder` en su lugar. */
  imageUrl?: string | null;
  /** Contenido mostrado cuando no hay foto (ícono de categoría, iniciales, etc). */
  placeholder?: ReactNode;
  /** Badge de estado, posicionado arriba a la izquierda de la foto (solo en colapsado, layout "grid"). */
  badge?: ReactNode;
  title: string;
  /** El único dato clave visible en el estado colapsado (precio, stock, etc). */
  keyValue: ReactNode;
  /** Campos mostrados en el estado expandido. */
  fields: CardPopoverField[];
  /** Línea de autoría (D3), p. ej. "Editado por Natalia · hace 2 días". Omitir si no hay autor. */
  author?: string | null;
  /** Botones de acción en el estado expandido (editar, eliminar, acción contextual). */
  actions?: ReactNode;
  /** Contenido adicional bajo los campos (p. ej. un HistorialTimeline embebido). */
  children?: ReactNode;
  className?: string;
  /**
   * "grid" (por defecto): tarjeta cuadrada con foto arriba, pensada para grids (Productos, Insumos, Stock).
   * "row": fila compacta de ancho completo con ícono a la izquierda, pensada para listas verticales (Pedidos, Clientes).
   */
  layout?: "grid" | "row";
}) {
  const [open, setOpen] = useState(false);
  /**
   * Estado independiente del sheet móvil (no comparte `open` con el Popover de
   * escritorio de Base UI). Base UI sigue escuchando clics "afuera" de su propio
   * popup incluso con el contenido oculto por CSS en móvil (`hidden lg:block`);
   * si el sheet móvil dependiera de `open`, tocar un botón de acción dentro del
   * sheet (fuera del popup real de Base UI) se interpretaba como clic afuera y
   * cerraba el sheet antes de ejecutar la acción.
   */
  const [mobileOpen, setMobileOpen] = useState(false);

  /**
   * El popover de escritorio debe tener el mismo ancho que la tarjeta que lo
   * abre (antes usaba un `w-72` fijo para todas las tarjetas, sin importar
   * cuántas columnas entraran en la grilla). Se mide el trigger real.
   */
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState<number>();

  const medirTrigger = () => {
    if (triggerRef.current) setTriggerWidth(triggerRef.current.offsetWidth);
  };

  useEffect(() => {
    medirTrigger();
    window.addEventListener("resize", medirTrigger);
    return () => window.removeEventListener("resize", medirTrigger);
  }, []);

  const photo = (heightClass: string, sizes: string) => (
    <div className={cn("relative bg-cover bg-center", heightClass)}>
      {imageUrl ? (
        <Image src={imageUrl} alt="" fill className="object-cover" sizes={sizes} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-background">
          {placeholder}
        </div>
      )}
    </div>
  );

  const expandedBody = (
    <>
      <div className="overflow-hidden rounded-t-xl">
        {photo("h-32", "(max-width: 1024px) 100vw, 288px")}
      </div>
      <div className="p-4">
        <p className="font-serif text-lg leading-snug text-foreground">{title}</p>
        {fields.length > 0 && (
          <dl className="mt-2 space-y-1.5 text-sm">
            {fields.map((f, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd className="font-medium text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {children}
        {author && (
          <p className="mt-3 border-t pt-2.5 text-xs text-muted-foreground">{author}</p>
        )}
        {actions && <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </>
  );

  const collapsedGrid = (
    <>
      <div className="relative">
        {photo("h-20 sm:h-24", "(max-width: 640px) 50vw, 20vw")}
        {badge && <div className="absolute left-2 top-2">{badge}</div>}
      </div>
      <div className="p-2.5">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {title}
        </p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">{keyValue}</p>
      </div>
    </>
  );

  const collapsedRow = (
    <div className="flex items-center gap-3 p-3">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill className="object-cover" sizes="40px" />
        ) : (
          placeholder
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{title}</p>
          {badge}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{keyValue}</p>
      </div>
    </div>
  );

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <span className="contents" onClick={() => { medirTrigger(); setMobileOpen(true); }}>
          <PopoverTrigger
            render={
              <button
                ref={triggerRef}
                type="button"
                className={cn(
                  "w-full overflow-hidden rounded-lg bg-card text-left ring-1 ring-foreground/10 transition-shadow hover:shadow-[0_10px_28px_rgba(75,45,30,0.10)]",
                  className
                )}
              >
                {layout === "row" ? collapsedRow : collapsedGrid}
              </button>
            }
          />
        </span>

        {/* Desktop: popover anclado, mismo ancho que la tarjeta */}
        <PopoverContent
          side="bottom"
          align="start"
          className="hidden w-auto lg:block"
          style={triggerWidth ? { width: triggerWidth } : undefined}
        >
          {expandedBody}
        </PopoverContent>
      </Popover>

      {/* Móvil: sheet inferior — visibilidad controlada solo por mobileOpen */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto overscroll-contain rounded-t-2xl bg-popover pb-[calc(env(safe-area-inset-bottom)+4.5rem)] shadow-2xl">
            <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-foreground/15" />
            {expandedBody}
          </div>
        </div>
      )}
    </>
  );
}
