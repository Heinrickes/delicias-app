"use client";

import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import { ClienteCard } from "@/components/shared/ClienteCard";
import { FilterBar } from "@/components/shared/FilterBar";
import { HistorialTimeline } from "@/components/shared/HistorialTimeline";
import { agruparPorPeriodo, inicialesDe } from "@/lib/historial";
import { formatMoneda, LOCALE } from "@/lib/constants";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
};

type VentaHistorial = {
  fecha: string;
  total: number;
  nombre_producto: string;
  cantidad: number;
  creado_por: string | null;
  modo_pago: string | null;
};

const MODO_PAGO_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

export function ClientesListado({
  clientes,
  pedidosPorCliente,
  ventasPorCliente,
  historialPorCliente,
  perfiles,
}: {
  clientes: Cliente[];
  pedidosPorCliente: Record<string, number>;
  ventasPorCliente: Record<string, number>;
  historialPorCliente: Record<string, VentaHistorial[]>;
  perfiles: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const historialRef = useRef<HTMLDivElement>(null);

  const filtrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(query.toLowerCase())
  );

  const seleccionado = clientes.find((c) => c.id === seleccionadoId) ?? null;

  useEffect(() => {
    if (seleccionadoId) {
      historialRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [seleccionadoId]);

  const chips = seleccionado
    ? agruparPorPeriodo(historialPorCliente[seleccionado.id] ?? []).map((b) => ({
        key: b.key,
        label: b.label,
        count: b.items.length,
        amountLabel: formatMoneda(b.items.reduce((s, v) => s + v.total, 0)),
        eventos: b.items.map((v, i) => ({
          id: `${b.key}-${i}`,
          descripcion: `${v.cantidad}× ${v.nombre_producto}${v.modo_pago ? ` · ${MODO_PAGO_LABEL[v.modo_pago] ?? v.modo_pago}` : ""}`,
          when: new Date(v.fecha).toLocaleDateString(LOCALE, { day: "2-digit", month: "short" }),
          amount: formatMoneda(v.total),
          author: inicialesDe(v.creado_por ? perfiles[v.creado_por] : null),
        })),
      }))
    : [];

  return (
    <div className="space-y-3">
      <FilterBar placeholder="Buscar cliente..." onSearch={setQuery} />
      {filtrados.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtrados.map((cliente) => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              pedidos={pedidosPorCliente[cliente.id] ?? 0}
              totalVentas={ventasPorCliente[cliente.id] ?? 0}
              onVerHistorial={() => setSeleccionadoId(cliente.id)}
            />
          ))}
        </div>
      )}

      {seleccionado && (
        <section ref={historialRef} className="scroll-mt-6 space-y-3 border-t pt-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </span>
              <h3 className="text-base font-semibold text-foreground">
                Historial de compras · {seleccionado.nombre}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSeleccionadoId(null)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cerrar
            </button>
          </div>
          {chips.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
              Este cliente todavía no tiene compras registradas.
            </div>
          ) : (
            <HistorialTimeline chips={chips} />
          )}
        </section>
      )}
    </div>
  );
}
