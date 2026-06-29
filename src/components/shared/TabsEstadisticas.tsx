"use client";

import { useState } from "react";
import {
  ProduccionChart,
  TopProductosChart,
  VentasChart,
} from "@/components/shared/ReportesCharts";
import { SeccionReporte } from "@/components/shared/SeccionReporte";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Badge } from "@/components/ui/badge";
import { formatMoneda, LOCALE } from "@/lib/constants";
import {
  Receipt,
  TrendingUp,
  Calendar,
  CalendarDays,
  Boxes,
  ShoppingCart,
  Percent,
  AlertTriangle,
  Package,
} from "lucide-react";
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

function fmtDia(fechaISO: string) {
  return new Date(fechaISO).toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Santiago",
  });
}

function fmtDiaKey(fechaISO: string) {
  return new Date(fechaISO)
    .toLocaleDateString("sv", { timeZone: "America/Santiago" });
}

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

  // Agrupar transacciones por día
  const txPorDia = transacciones.reduce<Map<string, Transaccion[]>>((acc, v) => {
    const key = fmtDiaKey(v.fecha);
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key)!.push(v);
    return acc;
  }, new Map());
  const diasOrdenados = Array.from(txPorDia.entries()).sort(([a], [b]) =>
    b.localeCompare(a)
  );

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

          {/* Feed de transacciones agrupado por día */}
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
              <div className="space-y-4">
                {diasOrdenados.map(([key, items]) => (
                  <div key={key}>
                    <p className="mb-1.5 text-xs font-semibold capitalize text-muted-foreground">
                      {fmtDia(key)}
                    </p>
                    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                      {items.map((v, idx) => {
                        const margen = v.total - v.costo_total;
                        return (
                          <div
                            key={v.id}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3",
                              idx !== 0 && "border-t"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-sm font-semibold text-foreground">
                                  {v.nombre_producto}
                                </span>
                                {v.pedido_id && (
                                  <Badge className="shrink-0 bg-primary/10 text-[10px] text-primary">
                                    Pedido
                                  </Badge>
                                )}
                              </div>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {v.clientes?.nombre ?? "Venta directa"}
                                {" · "}
                                {v.cantidad} u
                                {" · "}
                                <span className="text-success">+{formatMoneda(margen)}</span>
                              </p>
                            </div>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                              {formatMoneda(v.total)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
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
            <>
              <div className="flex flex-col gap-2">
                {[...insumos]
                  .sort((a, b) => b.costo_unitario * b.stock - a.costo_unitario * a.stock)
                  .map((i) => {
                    const agotado = i.stock <= 0;
                    const bajo = !agotado && i.stock < i.stock_minimo;
                    const valor = i.costo_unitario * i.stock;
                    const pct = Math.min(100, Math.round((i.stock / Math.max(i.stock_minimo, 1)) * 100));
                    return (
                      <CollapsibleCard
                        key={i.id}
                        icon={<Package className="h-4 w-4" />}
                        title={i.nombre}
                        badge={
                          agotado ? (
                            <Badge className="shrink-0 bg-danger/15 text-[10px] text-danger">Agotado</Badge>
                          ) : bajo ? (
                            <Badge className="shrink-0 bg-gold/15 text-[10px] text-gold">Bajo</Badge>
                          ) : (
                            <Badge className="shrink-0 bg-success/15 text-[10px] text-success">OK</Badge>
                          )
                        }
                        subtitle={
                          <span>
                            {i.stock} {i.unidad} · <span className="font-semibold text-foreground">{formatMoneda(valor)}</span>
                          </span>
                        }
                        fields={[
                          { label: "Stock actual", value: `${i.stock} ${i.unidad}` },
                          { label: "Stock mínimo", value: `${i.stock_minimo} ${i.unidad}` },
                          { label: "Costo unitario", value: formatMoneda(i.costo_unitario) },
                          { label: "Valor en stock", value: formatMoneda(valor) },
                        ]}
                      >
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              agotado ? "bg-danger" : bajo ? "bg-gold" : "bg-success"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </CollapsibleCard>
                    );
                  })}
              </div>
              <div className="flex items-center justify-between rounded-xl bg-card px-5 py-3 ring-1 ring-foreground/10">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total despensa
                </span>
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {formatMoneda(valorDespensa)}
                </span>
              </div>
            </>
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
