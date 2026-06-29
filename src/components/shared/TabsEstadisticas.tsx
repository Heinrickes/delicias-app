"use client";

import { useState } from "react";
import {
  ProduccionChart,
  TopProductosChart,
  VentasChart,
} from "@/components/shared/ReportesCharts";
import { SeccionReporte } from "@/components/shared/SeccionReporte";
import { Badge } from "@/components/ui/badge";
import { formatMoneda, LOCALE } from "@/lib/constants";
import { Receipt, TrendingUp, Calendar, CalendarDays, Boxes, ShoppingCart, Percent, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Transaccion = {
  id: string;
  nombre_producto: string;
  cantidad: number;
  total: number;
  costo_total: number;
  fecha: string;
  pedido_id: string | null;
  clientes: { nombre: string } | null;
};

type InsumoStats = {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
  stock_minimo: number;
  costo_unitario: number;
};

type Props = {
  transacciones: Transaccion[];
  ventasPorDia: { dia: string; ingresos: number; costos: number }[];
  produccionPorDia: { dia: string; cantidad: number }[];
  topVendidos: { nombre: string; unidades: number }[];
  topProducidos: { nombre: string; unidades: number }[];
  insumos: InsumoStats[];
  metrics: {
    totalRango: number;
    margenRango: number;
    unidadesRango: number;
    ventasHoy: number;
    ventasMes: number;
    stockTotal: number;
    valorStock: number;
  };
  nDias: number;
};

type TabKey = "ventas" | "inventario" | "costos";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ventas", label: "Ventas" },
  { key: "inventario", label: "Inventario" },
  { key: "costos", label: "Costos" },
];

export function TabsEstadisticas({
  transacciones,
  ventasPorDia,
  produccionPorDia,
  topVendidos,
  topProducidos,
  insumos,
  metrics,
  nDias,
}: Props) {
  const [tab, setTab] = useState<TabKey>("ventas");

  const margenPct =
    metrics.totalRango > 0
      ? Math.round((metrics.margenRango / metrics.totalRango) * 100)
      : 0;

  const valorDespensa = insumos.reduce((s, i) => s + i.costo_unitario * i.stock, 0);
  const insumosbajoMinimo = insumos.filter((i) => i.stock < i.stock_minimo);
  const costoPorVenta =
    metrics.unidadesRango > 0
      ? Math.round(
          insumos.reduce((s, v) => s + v.costo_unitario * v.stock, 0) /
            metrics.unidadesRango
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Selector de tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
              tab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Ventas ── */}
      {tab === "ventas" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Metric
              label="Ventas del período"
              value={formatMoneda(metrics.totalRango)}
              helper={`margen ${margenPct}%`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <Metric
              label="Ventas de hoy"
              value={formatMoneda(metrics.ventasHoy)}
              icon={<Calendar className="h-4 w-4" />}
            />
            <Metric
              label="Ventas del mes"
              value={formatMoneda(metrics.ventasMes)}
              icon={<CalendarDays className="h-4 w-4" />}
            />
            <Metric
              label="Unidades vendidas"
              value={metrics.unidadesRango.toString()}
              helper="en el período"
              icon={<Boxes className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SeccionReporte
              titulo="Ingresos vs costos"
              subtitulo={`Últimos ${nDias} días`}
              chart={<VentasChart data={ventasPorDia} />}
              lista={<ListaDias data={ventasPorDia} />}
            />
            <SeccionReporte
              titulo="Top productos vendidos"
              subtitulo="Por unidades en el período"
              chart={
                topVendidos.length ? (
                  <TopProductosChart data={topVendidos} />
                ) : (
                  <Vacio />
                )
              }
              lista={<ListaRanking data={topVendidos} sufijo="vendidas" />}
            />
          </div>

          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Historial de transacciones ({transacciones.length})
            </h3>
            {transacciones.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card p-12 text-center">
                <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No hay ventas registradas
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-5 py-3 font-semibold">Fecha</th>
                        <th className="px-5 py-3 font-semibold">Producto</th>
                        <th className="px-5 py-3 font-semibold">Cliente</th>
                        <th className="px-5 py-3 text-center font-semibold">Cant.</th>
                        <th className="px-5 py-3 text-right font-semibold">Total</th>
                        <th className="px-5 py-3 text-right font-semibold">Margen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transacciones.map((v) => {
                        const m = v.total - v.costo_total;
                        return (
                          <tr key={v.id} className="hover:bg-background/30">
                            <td className="whitespace-nowrap px-5 py-3 tabular-nums text-muted-foreground">
                              {new Date(v.fecha).toLocaleDateString(LOCALE, {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                timeZone: "America/Santiago",
                              })}
                            </td>
                            <td className="whitespace-nowrap px-5 py-3 font-semibold text-foreground">
                              <span className="flex items-center gap-2">
                                {v.nombre_producto}
                                {v.pedido_id && (
                                  <Badge className="bg-primary/10 text-primary">
                                    Pedido
                                  </Badge>
                                )}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {v.clientes?.nombre ?? "—"}
                            </td>
                            <td className="px-5 py-3 text-center tabular-nums text-muted-foreground">
                              {v.cantidad}
                            </td>
                            <td className="px-5 py-3 text-right font-medium tabular-nums text-foreground">
                              {formatMoneda(v.total)}
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums text-success">
                              {formatMoneda(m)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Tab Inventario ── */}
      {tab === "inventario" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Metric
              label="Stock total"
              value={`${metrics.stockTotal} u`}
              helper={formatMoneda(metrics.valorStock)}
              icon={<Boxes className="h-4 w-4" />}
            />
            <Metric
              label="Valor inventario"
              value={formatMoneda(metrics.valorStock)}
              helper="productos terminados"
              icon={<ShoppingCart className="h-4 w-4" />}
            />
            <Metric
              label="Unidades producidas"
              value={produccionPorDia.reduce((s, d) => s + d.cantidad, 0).toString()}
              helper="en el período"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <Metric
              label="Insumos bajo mínimo"
              value={insumosbajoMinimo.length.toString()}
              helper={insumosbajoMinimo.length > 0 ? "revisar stock" : "todo en orden"}
              danger={insumosbajoMinimo.length > 0}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SeccionReporte
              titulo="Producción por día"
              subtitulo={`Últimos ${nDias} días`}
              chart={<ProduccionChart data={produccionPorDia} />}
              lista={
                <ListaDias
                  data={produccionPorDia.map((d) => ({
                    dia: d.dia,
                    ingresos: d.cantidad,
                    costos: 0,
                  }))}
                  soloCantidad
                />
              }
            />
            <SeccionReporte
              titulo="Más producidos"
              subtitulo="Por unidades en el período"
              chart={
                topProducidos.length ? (
                  <TopProductosChart data={topProducidos} />
                ) : (
                  <Vacio />
                )
              }
              lista={<ListaRanking data={topProducidos} sufijo="producidas" />}
            />
          </div>
        </div>
      )}

      {/* ── Tab Costos ── */}
      {tab === "costos" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Metric
              label="Valor en despensa"
              value={formatMoneda(valorDespensa)}
              helper="insumos en stock"
              icon={<ShoppingCart className="h-4 w-4" />}
            />
            <Metric
              label="Margen del período"
              value={formatMoneda(metrics.margenRango)}
              helper={`${margenPct}% sobre ventas`}
              icon={<Percent className="h-4 w-4" />}
            />
            <Metric
              label="Costo estimado / venta"
              value={costoPorVenta > 0 ? formatMoneda(costoPorVenta) : "—"}
              helper="promedio por unidad"
              icon={<Receipt className="h-4 w-4" />}
            />
            <Metric
              label="Insumos bajo mínimo"
              value={insumosbajoMinimo.length.toString()}
              helper={insumosbajoMinimo.length > 0 ? "requieren reposición" : "todo en orden"}
              danger={insumosbajoMinimo.length > 0}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
          </div>

          {insumos.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-12 text-center">
              <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                No hay insumos registrados
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Agrega insumos en la sección Costos para ver el análisis aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-3 font-semibold">Insumo</th>
                      <th className="px-5 py-3 text-right font-semibold">Stock</th>
                      <th className="px-5 py-3 text-right font-semibold">Mínimo</th>
                      <th className="px-5 py-3 text-right font-semibold">Costo unit.</th>
                      <th className="px-5 py-3 text-right font-semibold">Valor total</th>
                      <th className="px-5 py-3 text-center font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {insumos
                      .sort((a, b) => b.costo_unitario * b.stock - a.costo_unitario * a.stock)
                      .map((i) => {
                        const bajo = i.stock < i.stock_minimo;
                        return (
                          <tr key={i.id} className="hover:bg-background/30">
                            <td className="whitespace-nowrap px-5 py-3 font-semibold text-foreground">
                              {i.nombre}
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums text-foreground">
                              {i.stock} {i.unidad}
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                              {i.stock_minimo} {i.unidad}
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                              {formatMoneda(i.costo_unitario)}
                            </td>
                            <td className="px-5 py-3 text-right font-medium tabular-nums text-foreground">
                              {formatMoneda(i.costo_unitario * i.stock)}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                  bajo
                                    ? "bg-danger/15 text-danger"
                                    : "bg-success/15 text-success"
                                )}
                              >
                                {bajo ? "Bajo" : "OK"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-background/40">
                      <td colSpan={4} className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Total despensa
                      </td>
                      <td className="px-5 py-3 text-right font-bold tabular-nums text-foreground">
                        {formatMoneda(valorDespensa)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Componentes internos ──

function Metric({
  label,
  value,
  helper,
  icon,
  danger,
}: {
  label: string;
  value: string;
  helper?: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-center gap-2">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-md bg-background", danger ? "text-danger" : "text-gold")}>
          {icon}
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {helper && (
        <p className={cn("mt-1 text-xs", danger ? "text-danger" : "text-success")}>
          {helper}
        </p>
      )}
    </div>
  );
}

function ListaDias({
  data,
  soloCantidad = false,
}: {
  data: { dia: string; ingresos: number; costos: number }[];
  soloCantidad?: boolean;
}) {
  const filas = data.filter((d) => d.ingresos !== 0 || d.costos !== 0).reverse();
  if (filas.length === 0) return <Vacio />;
  return (
    <div className="max-h-[260px] overflow-y-auto">
      <table className="w-full text-left text-sm">
        <tbody className="divide-y">
          {filas.map((d, i) => (
            <tr key={i}>
              <td className="py-2 text-muted-foreground">{d.dia}</td>
              {soloCantidad ? (
                <td className="py-2 text-right tabular-nums text-foreground">
                  {d.ingresos} u
                </td>
              ) : (
                <>
                  <td className="py-2 text-right tabular-nums text-foreground">
                    {formatMoneda(d.ingresos)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">
                    {formatMoneda(d.costos)}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListaRanking({
  data,
  sufijo,
}: {
  data: { nombre: string; unidades: number }[];
  sufijo: string;
}) {
  if (data.length === 0) return <Vacio />;
  const max = data[0]?.unidades ?? 1;
  return (
    <ul className="max-h-[260px] space-y-2.5 overflow-y-auto">
      {data.map((r, i) => (
        <li key={r.nombre} className="flex items-center gap-3">
          <span className="w-4 text-xs font-semibold text-muted-foreground">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {r.nombre}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {r.unidades} {sufijo}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-gold/70"
                style={{ width: `${Math.max(6, (r.unidades / max) * 100)}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Vacio() {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      Sin datos en este período.
    </div>
  );
}
