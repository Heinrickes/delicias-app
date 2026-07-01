"use client";

import { useState } from "react";
import { ShoppingCart, Plus, ClipboardList } from "lucide-react";
import { TiendaCompra, type InsumoTienda } from "@/components/shared/TiendaCompra";
import { InsumoFormDialog } from "@/components/shared/CostosManager";
import { ListaCompraModal, type ListaCompra } from "@/components/shared/ListaCompraModal";
import { formatMoneda } from "@/lib/constants";

export function ComprasView({
  insumosParaTienda,
  listas,
}: {
  insumosParaTienda: InsumoTienda[];
  listas: ListaCompra[];
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [listaAbierta, setListaAbierta] = useState<ListaCompra | null>(null);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Despensa
          </p>
          <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
            Compras
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tu despensa: compra insumos y controla tu stock.
          </p>
        </div>
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-terracotta/10"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta text-white shadow">
              <ShoppingCart className="h-6 w-6" />
            </span>
            <span className="text-[11px] font-semibold text-terracotta">Tu compra</span>
          </button>
          <InsumoFormDialog
            trigger={
              <button
                type="button"
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-primary/10"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  <Plus className="h-6 w-6" />
                </span>
                <span className="text-[11px] font-semibold text-primary">Agregar insumo</span>
              </button>
            }
          />
        </div>
      </header>

      <TiendaCompra
        insumos={insumosParaTienda}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      {/* Mis listas de compra */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">
            Mis listas de compra
            {listas.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({listas.length})
              </span>
            )}
          </h3>
        </div>

        {listas.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
            Aún no hay listas. Agrega insumos al carrito y planifica tu compra.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {listas.map((lista) => (
              <button
                key={lista.id}
                type="button"
                onClick={() => setListaAbierta(lista)}
                className="flex flex-col gap-3 rounded-xl bg-card p-4 text-left ring-1 ring-gold/30 transition-shadow hover:shadow-[0_8px_24px_rgba(75,45,30,0.08)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground leading-snug">
                    {lista.nombre || "Lista sin nombre"}
                  </p>
                  <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
                    Planificada
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">
                      {lista.items.length} {lista.items.length === 1 ? "insumo" : "insumos"}
                      {lista.proveedor ? ` · ${lista.proveedor}` : ""}
                    </p>
                    {lista.fecha_planificada && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(lista.fecha_planificada).toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    )}
                  </div>
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {formatMoneda(lista.total)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <ListaCompraModal
        lista={listaAbierta}
        open={!!listaAbierta}
        onOpenChange={(v) => { if (!v) setListaAbierta(null); }}
      />
    </div>
  );
}
