"use client";

import { useState } from "react";
import {
  CompraVsVentaChart,
  ProduccionChart,
  TopProductosChart,
  VentasChart,
} from "@/components/shared/ReportesCharts";
import { SeccionReporte } from "@/components/shared/SeccionReporte";
import { HistorialTimeline } from "@/components/shared/HistorialTimeline";
import { agruparPorPeriodo, inicialesDe } from "@/lib/historial";
import { formatMoneda, LOCALE } from "@/lib/constants";
import {
  Receipt,
  TrendingUp,
  Calendar,
  CalendarDays,
  Boxes,
  ShoppingCart,
  AlertTriangle,
  Coins,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MODO_PAGO_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

type Transaccion = {
  id: string;
  nombre_producto: string;
  cantidad: number;
  total: number;
  costo_total: number;
  fecha: string;
  pedido_id: string | null;
  clientes: { nombre: string } | null;
  creado_por: string | null;
  modo_pago: string | null;
};

type InsumoStats = {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
  stock_minimo: number;
  costo_unitario: number;
};

type CompraStats = {
  id: string;
  nombre: string | null;
  total: number;
  estado: string;
  proveedor: string | null;
  fecha_completada: string | null;
  fecha_planificada: string | null;
  items: { nombre: string; cantidad: number; precio_unitario: number }[];
  creado_por: string | null;
};

type Props = {
  transacciones: Transaccion[];
  ventasPorDia: { dia: string; ingresos: number; costos: number }[];
  produccionPorDia: { dia: string; cantidad: number }[];
  topVendidos: { nombre: string; unidades: number }[];
  topProducidos: { nombre: string; unidades: number }[];
  insumos: InsumoStats[];
  compras: CompraStats[];
  compraVsVenta: { mes: string; gastoCompras: number; costoVendido: number }[];
  perfiles: Record<string, string>;
  metrics: {
    totalRango: number;
    margenRango: number;
    unidadesRango: number;
    ventasHoy: number;
    ventasMes: number;
    stockTotal: number;
    valorStock: number;
    productosStockBajo: number;
    porCobrarTotal: number;
    porCobrarCount: number;
    porCobrarVencidoTotal: number;
    porCobrarVencidoCount: number;
    pedidosPendientes: number;
    pedidosPagados: number;
    gastoCompras6m: number;
    costoVendido6m: number;
    margenBruto6m: number;
  };
  nDias: number;
  initialTab?: TabKey;
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
  compras,
  compraVsVenta,
  metrics,
  nDias,
  initialTab,
  perfiles,
}: Props) {
  const [tab, setTab] = useState<TabKey>(initialTab ?? "ventas");

  const margenPct =
    metrics.totalRango > 0
      ? Math.round((metrics.margenRango / metrics.totalRango) * 100)
      : 0;

  const valorDespensa = insumos.reduce((s, i) => s + i.costo_unitario * i.stock, 0);
  const insumosbajoMinimo = insumos.filter((i) => i.stock < i.stock_minimo);
  const gastoDelPeriodo = compras
    .filter((c) => c.estado === "completado")
    .reduce((s, c) => s + c.total, 0);
  const comprasPendientes = compras.filter((c) => c.estado === "planificado").length;
  const costoPorVenta =
    metrics.unidadesRango > 0
      ? Math.round(
          insumos.reduce((s, v) => s + v.costo_unitario * v.stock, 0) /
            metrics.unidadesRango
        )
      : 0;

  // Historial de transacciones (G4)
  const chipsTransacciones = agruparPorPeriodo(transacciones).map((b) => ({
    key: b.key,
    label: b.label,
    count: b.items.length,
    amountLabel: formatMoneda(b.items.reduce((s, v) => s + v.total, 0)),
    eventos: b.items.map((v) => ({
      id: v.id,
      descripcion:
        `${v.clientes?.nombre ?? "Venta directa"} · ${v.cantidad}× ${v.nombre_producto}` +
        (v.modo_pago ? ` · ${MODO_PAGO_LABEL[v.modo_pago] ?? v.modo_pago}` : ""),
      when: new Date(v.fecha).toLocaleDateString(LOCALE, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      amount: formatMoneda(v.total),
      amountTone: "pos" as const,
      author: inicialesDe(v.creado_por ? perfiles[v.creado_por] : null),
    })),
  }));

  // Historial de compras del período (C8)
  const chipsCompras = agruparPorPeriodo(
    compras
      .map((c) => ({ ...c, fecha: c.estado === "completado" ? c.fecha_completada : c.fecha_planificada }))
      .filter((c) => c.fecha !== null) as (CompraStats & { fecha: string })[]
  ).map((b) => ({
    key: b.key,
    label: b.label,
    count: b.items.length,
    amountLabel: formatMoneda(b.items.reduce((s, c) => s + c.total, 0)),
    eventos: b.items.map((c) => ({
      id: c.id,
      descripcion:
        (c.nombre ||
          c.items
            .slice(0, 3)
            .map((i) => i.nombre)
            .join(", ") ||
          "Compra de insumos") +
        (c.estado === "planificado" ? " · Planificada" : ""),
      when: new Date(c.fecha).toLocaleDateString(LOCALE, { day: "2-digit", month: "short" }),
      amount: formatMoneda(c.total),
      amountTone: c.estado === "completado" ? ("neutral" as const) : ("neg" as const),
      author: inicialesDe(c.creado_por ? perfiles[c.creado_por] : null),
    })),
  }));

  return (
    <div className="space-y-6">
      {/* Selector de tabs — compacto en desktop, ancho completo en móvil */}
      <div className="flex gap-1 rounded-xl bg-muted p-1 lg:inline-flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors lg:flex-none lg:px-6",
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

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Pedidos
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
              <Metric
                label="Pendientes"
                value={metrics.pedidosPendientes.toString()}
                helper="sin entregar"
                icon={<ClipboardList className="h-4 w-4" />}
              />
              <Metric
                label="Pagados"
                value={metrics.pedidosPagados.toString()}
                helper="entregados y cobrados"
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Por cobrar
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Metric
                label="Total por cobrar"
                value={formatMoneda(metrics.porCobrarTotal)}
                icon={<Coins className="h-4 w-4" />}
              />
              <Metric
                label="Pedidos pendientes"
                value={metrics.porCobrarCount.toString()}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <Metric
                label="Vencido"
                value={formatMoneda(metrics.porCobrarVencidoTotal)}
                danger={metrics.porCobrarVencidoTotal > 0}
                helper={`${metrics.porCobrarVencidoCount} ${metrics.porCobrarVencidoCount === 1 ? "pedido" : "pedidos"}`}
                icon={<AlertTriangle className="h-4 w-4" />}
              />
            </div>
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

          {/* Historial de transacciones (G4) */}
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
              <HistorialTimeline chips={chipsTransacciones} />
            )}
          </section>
        </div>
      )}

      {/* ── Tab Inventario ── */}
      {tab === "inventario" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
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
              label="Productos bajo stock"
              value={metrics.productosStockBajo.toString()}
              helper={metrics.productosStockBajo > 0 ? "revisar en Productos" : "todo en orden"}
              danger={metrics.productosStockBajo > 0}
              icon={<AlertTriangle className="h-4 w-4" />}
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

          <SeccionReporte
            titulo="Más rotación"
            subtitulo="Unidades vendidas en el período"
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
      )}

      {/* ── Tab Costos ── */}
      {tab === "costos" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            <Metric
              label="Insumos activos"
              value={insumos.length.toString()}
              helper="en despensa"
              icon={<Boxes className="h-4 w-4" />}
            />
            <Metric
              label="Valor en despensa"
              value={formatMoneda(valorDespensa)}
              helper="insumos en stock"
              icon={<ShoppingCart className="h-4 w-4" />}
            />
            <Metric
              label="Gasto del período"
              value={formatMoneda(gastoDelPeriodo)}
              helper="en compras completadas"
              icon={<Receipt className="h-4 w-4" />}
            />
            <Metric
              label="Compras pendientes"
              value={comprasPendientes.toString()}
              helper={comprasPendientes > 0 ? "planificadas" : "todo al día"}
              danger={comprasPendientes > 0}
              icon={<ShoppingCart className="h-4 w-4" />}
            />
            <Metric
              label="Insumos bajo mínimo"
              value={insumosbajoMinimo.length.toString()}
              helper={insumosbajoMinimo.length > 0 ? "requieren reposición" : "todo en orden"}
              danger={insumosbajoMinimo.length > 0}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
          </div>

          {/* Compra vs. venta — B3 */}
          <section>
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Gasto en compras vs. costo de lo vendido
            </h3>
            <p className="mb-3 max-w-2xl text-xs text-muted-foreground">
              Son dos cosas distintas: el <strong>gasto en compras</strong> es lo que
              salió de la billetera cada mes; el <strong>costo de lo vendido</strong> es
              el consumo de insumos asociado a lo que realmente vendiste ese mes.
              Comparar solo totales de compra vs. venta engaña cuando compras stock un
              mes y lo vendes en otro — el margen bruto es el indicador honesto.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Metric
                label="Gasto en compras (6 meses)"
                value={formatMoneda(metrics.gastoCompras6m)}
                helper="compras completadas"
                icon={<ShoppingCart className="h-4 w-4" />}
              />
              <Metric
                label="Costo de lo vendido (6 meses)"
                value={formatMoneda(metrics.costoVendido6m)}
                helper="insumos consumidos en ventas"
                icon={<Receipt className="h-4 w-4" />}
              />
              <Metric
                label="Margen bruto (6 meses)"
                value={formatMoneda(metrics.margenBruto6m)}
                helper="ventas − costo de lo vendido"
                icon={<TrendingUp className="h-4 w-4" />}
              />
            </div>
            <div className="mt-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <div className="mb-4">
                <h4 className="text-base font-semibold text-foreground">
                  Comparativo mensual
                </h4>
                <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
              </div>
              <CompraVsVentaChart data={compraVsVenta} />
            </div>
          </section>

          {/* Historial de compras del período (G4) */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Compras del período ({compras.length})
            </h3>
            {compras.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
                Sin compras registradas. Inicia una compra desde Compras.
              </div>
            ) : (
              <HistorialTimeline chips={chipsCompras} />
            )}
          </section>

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
