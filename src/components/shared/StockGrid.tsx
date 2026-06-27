"use client";

import { StockMovimientoDialog } from "@/components/shared/StockMovimientoDialog";
import { formatMoneda } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Producto = {
  id: string;
  nombre: string;
  categoria: string | null;
  stock: number;
  stock_minimo: number;
  costo: number;
  unidad: string;
};

export function StockGrid({ productos }: { productos: Producto[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {productos.map((p) => {
        const agotado = p.stock <= 0;
        const bajo = p.stock < p.stock_minimo;

        return (
          <StockMovimientoDialog
            key={p.id}
            producto={{ id: p.id, nombre: p.nombre, stock: p.stock, stock_minimo: p.stock_minimo }}
            trigger={
              <button
                type="button"
                className="group flex w-full flex-col gap-2 rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition-all hover:ring-primary/40 hover:shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                    {p.nombre}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold leading-none",
                      agotado
                        ? "bg-danger/15 text-danger"
                        : bajo
                          ? "bg-gold/15 text-gold"
                          : "bg-success/15 text-success"
                    )}
                  >
                    {agotado ? "Agotado" : bajo ? "Bajo" : "OK"}
                  </span>
                </div>

                <p className="text-xl font-bold tabular-nums text-foreground">
                  {p.stock}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {p.unidad}
                  </span>
                </p>

                <p className="text-xs text-muted-foreground">
                  {formatMoneda(p.costo * p.stock)}
                </p>

                {p.categoria && (
                  <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    {p.categoria}
                  </p>
                )}
              </button>
            }
          />
        );
      })}
    </div>
  );
}
