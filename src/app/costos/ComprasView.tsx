"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, ClipboardList } from "lucide-react";
import { TiendaCompra, type InsumoTienda } from "@/components/shared/TiendaCompra";
import { ListaCompraModal, type ListaCompra } from "@/components/shared/ListaCompraModal";
import { ActionButton } from "@/components/shared/ActionButton";
import { HistorialTimeline } from "@/components/shared/HistorialTimeline";
import { agruparPorPeriodo, inicialesDe } from "@/lib/historial";
import { formatMoneda, LOCALE } from "@/lib/constants";

type CompraCompletada = {
  id: string;
  nombre: string | null;
  total: number;
  proveedor: string | null;
  fecha_completada: string | null;
  items: { insumo_id: string; nombre: string; cantidad: number; precio_unitario: number }[];
  creado_por: string | null;
};

export function ComprasView({
  insumosParaTienda,
  listas,
  completadas = [],
  perfiles = {},
}: {
  insumosParaTienda: InsumoTienda[];
  listas: ListaCompra[];
  completadas?: CompraCompletada[];
  perfiles?: Record<string, string>;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [listaAbierta, setListaAbierta] = useState<ListaCompra | null>(null);

  const chipsHistorial = agruparPorPeriodo(
    completadas
      .filter((c) => c.fecha_completada !== null)
      .map((c) => ({ ...c, fecha: c.fecha_completada as string }))
  ).map((b) => ({
    key: b.key,
    label: b.label,
    count: b.items.length,
    amountLabel: formatMoneda(b.items.reduce((s, c) => s + c.total, 0)),
    eventos: b.items.map((c) => ({
      id: c.id,
      descripcion:
        c.nombre ||
        c.items
          .slice(0, 3)
          .map((i) => i.nombre)
          .join(", ") ||
        "Compra de insumos",
      when: new Date(c.fecha).toLocaleDateString(LOCALE, { day: "2-digit", month: "short" }),
      amount: formatMoneda(c.total),
      amountTone: "neutral" as const,
      author: inicialesDe(c.creado_por ? perfiles[c.creado_por] : null),
    })),
  }));

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
            Tu despensa: compra insumos y controla tu stock. Para crear o editar
            insumos, ve a{" "}
            <Link href="/insumos" className="text-primary hover:underline">
              Insumos
            </Link>
            .
          </p>
        </div>
        <div className="flex justify-end gap-1">
          <ActionButton
            icon={<ShoppingCart className="h-6 w-6" />}
            label="Tu compra"
            color="terracota"
            onClick={() => setDrawerOpen(true)}
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

      {/* Historial de compras completadas */}
      {chipsHistorial.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Historial de compras</h3>
          <HistorialTimeline chips={chipsHistorial} />
        </section>
      )}
    </div>
  );
}
