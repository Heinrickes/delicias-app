"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { TiendaVenta } from "@/components/shared/TiendaVenta";
import type { ProductoTienda } from "@/components/shared/TiendaVenta";
import type { ClienteOpt } from "@/components/shared/TiendaVenta";

export function VentasView({
  productos,
  clientes,
}: {
  productos: ProductoTienda[];
  clientes: ClienteOpt[];
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Tienda
          </p>
          <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
            Vender
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Toca un producto para agregarlo a la bolsa y cierra la venta.
          </p>
        </div>
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-primary/10"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              <ShoppingBag className="h-6 w-6" />
            </span>
            <span className="text-[11px] font-semibold text-primary">Tu bolsa</span>
          </button>
        </div>
      </header>

      <TiendaVenta
        productos={productos}
        clientes={clientes}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
