import { createClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { MesSelector } from "@/components/shared/MesSelector";
import { getProductosEnriquecidos } from "@/lib/productos-data";
import { formatMoneda } from "@/lib/constants";
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  CalendarClock,
  ChartNoAxesCombined,
  Factory,
  Package,
  Percent,
  Receipt,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { BotanicalAccent } from "@/components/shared/BotanicalAccent";

type VentaMes = {
  nombre_producto: string;
  cantidad: number;
  total: number;
  costo_total: number;
};

/** Lista de los últimos `n` meses como opciones {value: "YYYY-MM", label}. */
function listaMeses(n = 12) {
  const hoy = new Date();
  const arr: { value: string; label: string }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const lbl = d.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
    arr.push({ value, label: lbl.charAt(0).toUpperCase() + lbl.slice(1) });
  }
  return arr;
}

async function getMesData(mes: string) {
  const supabase = await createClient();
  const [y, m] = mes.split("-").map(Number);
  const inicio = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const fin = new Date(y, m, 1, 0, 0, 0, 0);

  const [ventasRes, produccionRes] = await Promise.all([
    supabase
      .from("ventas")
      .select("nombre_producto, cantidad, total, costo_total")
      .gte("fecha", inicio.toISOString())
      .lt("fecha", fin.toISOString()),
    supabase
      .from("movimientos_stock")
      .select("cantidad")
      .eq("tipo", "produccion")
      .gte("fecha", inicio.toISOString())
      .lt("fecha", fin.toISOString()),
  ]);

  const ventas = (ventasRes.data ?? []) as VentaMes[];
  const acumulado = ventas.reduce((s, v) => s + v.total, 0);
  const unidades = ventas.reduce((s, v) => s + v.cantidad, 0);
  const margen = ventas.reduce((s, v) => s + (v.total - v.costo_total), 0);
  const produccionAcumulada = (produccionRes.data ?? []).reduce(
    (s, r) => s + (r.cantidad as number),
    0
  );

  const porProducto = new Map<string, { unidades: number; total: number }>();
  for (const v of ventas) {
    const acc = porProducto.get(v.nombre_producto) ?? { unidades: 0, total: 0 };
    acc.unidades += v.cantidad;
    acc.total += v.total;
    porProducto.set(v.nombre_producto, acc);
  }
  const topProductos = [...porProducto.entries()]
    .map(([nombre, d]) => ({ nombre, unidades: d.unidades, total: d.total }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 6);

  return { acumulado, unidades, margen, produccionAcumulada, topProductos };
}

async function getResumen() {
  const supabase = await createClient();

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const inicioAyer = new Date(inicioHoy);
  inicioAyer.setDate(inicioHoy.getDate() - 1);
  const hoyISO = `${inicioHoy.getFullYear()}-${String(
    inicioHoy.getMonth() + 1
  ).padStart(2, "0")}-${String(inicioHoy.getDate()).padStart(2, "0")}`;

  const inicioMes = new Date(inicioHoy.getFullYear(), inicioHoy.getMonth(), 1);
  const inicioMesStr = inicioMes.toISOString().slice(0, 10);
  const finMesStr = new Date(inicioHoy.getFullYear(), inicioHoy.getMonth() + 1, 1)
    .toISOString()
    .slice(0, 10);

  const [ventasRes, pedidosRes, insumosRes, comprasMesRes] = await Promise.all([
    supabase
      .from("ventas")
      .select("total, cantidad, fecha")
      .gte("fecha", inicioAyer.toISOString()),
    supabase
      .from("pedidos")
      .select("estado, fecha_entrega, total")
      .in("estado", ["pendiente", "por_cobrar"]),
    supabase
      .from("insumos")
      .select("costo_unitario, stock, stock_minimo, en_lista")
      .eq("activo", true),
    supabase
      .from("compras")
      .select("total")
      .eq("estado", "completado")
      .gte("fecha_completada", inicioMesStr)
      .lt("fecha_completada", finMesStr),
  ]);

  const ventas = ventasRes.data ?? [];
  const pedidos = pedidosRes.data ?? [];
  const insumos = insumosRes.data ?? [];
  const esHoy = (f: string) => new Date(f) >= inicioHoy;

  const ingresoHoy = ventas
    .filter((v) => esHoy(v.fecha))
    .reduce((s, v) => s + v.total, 0);
  const ingresoAyer = ventas
    .filter((v) => !esHoy(v.fecha))
    .reduce((s, v) => s + v.total, 0);

  const entregasHoy = pedidos.filter(
    (p) => p.estado === "pendiente" && p.fecha_entrega === hoyISO
  ).length;
  const totalPorCobrar = pedidos
    .filter((p) => p.estado === "por_cobrar")
    .reduce((s, p) => s + p.total, 0);

  const valorDespensa = insumos.reduce(
    (s, i) => s + i.costo_unitario * i.stock,
    0
  );
  const gastosMes = (comprasMesRes.data ?? []).reduce(
    (s, c) => s + c.total,
    0
  );
  const porComprar = insumos.filter(
    (i) => i.stock < i.stock_minimo || i.en_lista
  ).length;

  return { ingresoHoy, ingresoAyer, entregasHoy, totalPorCobrar, valorDespensa, gastosMes, porComprar };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const meses = listaMeses(12);
  const mes = meses.some((m) => m.value === mesParam) ? mesParam! : meses[0].value;

  const [productos, mesData, resumen] = await Promise.all([
    getProductosEnriquecidos(),
    getMesData(mes),
    getResumen(),
  ]);
  const { ingresoHoy, ingresoAyer, entregasHoy, totalPorCobrar, valorDespensa, gastosMes, porComprar } = resumen;
  const { acumulado, unidades, margen, produccionAcumulada, topProductos } = mesData;
  const simples = productos.filter((p) => p.tipo === "simple");
  const lowStockProducts = simples.filter((p) => p.stock < p.stock_minimo);

  const deltaHelper =
    ingresoAyer > 0
      ? `${ingresoHoy - ingresoAyer >= 0 ? "+" : ""}${Math.round(
          ((ingresoHoy - ingresoAyer) / ingresoAyer) * 100
        )}% vs ayer`
      : ingresoHoy > 0
        ? "Primeras ventas del día"
        : "Sin ventas aún";

  const margenPct = acumulado > 0 ? Math.round((margen / acumulado) * 100) : 0;
  const topProducto = topProductos[0];
  const maxUnidades = topProducto?.unidades ?? 0;

  return (
    <AppShell>
      <div className="space-y-7">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Panel
          </p>
          <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
            Resumen de tu taller
          </h2>
        </header>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          <MetricCard
            label="Ventas hoy"
            value={formatMoneda(ingresoHoy)}
            helper={deltaHelper}
            href="/reportes"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            label="Entregas hoy"
            value={entregasHoy.toString()}
            helper={entregasHoy === 1 ? "pedido por entregar" : "pedidos por entregar"}
            href="/pedidos"
            icon={<CalendarClock className="h-4 w-4" />}
          />
          <MetricCard
            label="Por cobrar"
            value={formatMoneda(totalPorCobrar)}
            helper="cuentas pendientes"
            href="/por-cobrar"
            icon={<Banknote className="h-4 w-4" />}
          />
          <MetricCard
            label="Stock bajo"
            value={lowStockProducts.length.toString()}
            helper={
              lowStockProducts.length > 0 ? "revisar inventario" : "todo en orden"
            }
            danger={lowStockProducts.length > 0}
            href="/stock"
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <MetricCard
            label="Valor en despensa"
            value={formatMoneda(valorDespensa)}
            helper="insumos en stock"
            href="/costos"
            icon={<Receipt className="h-4 w-4" />}
          />
          <MetricCard
            label="Gastos del mes"
            value={formatMoneda(gastosMes)}
            helper="en insumos"
            href="/costos"
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <MetricCard
            label="Por comprar"
            value={porComprar.toString()}
            helper={porComprar > 0 ? "insumos bajos o en lista" : "todo en orden"}
            danger={porComprar > 0}
            href="/costos"
            icon={<ShoppingCart className="h-4 w-4" />}
          />
        </section>

        {/* Resumen del mes */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold leading-tight text-foreground">
                Resumen del mes
              </h3>
              <p className="text-xs text-muted-foreground">
                Ventas acumuladas y productos más vendidos
              </p>
            </div>
            <MesSelector value={mes} meses={meses} />
          </div>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <MetricCard
              label="Ventas acumuladas"
              value={formatMoneda(acumulado)}
              helper="en el mes"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <MetricCard
              label="Unidades vendidas"
              value={unidades.toString()}
              helper="en el mes"
              icon={<Package className="h-4 w-4" />}
            />
            <MetricCard
              label="Margen del mes"
              value={formatMoneda(margen)}
              helper={`${margenPct}% sobre ventas`}
              icon={<Percent className="h-4 w-4" />}
            />
            <MetricCard
              label="Producción acumulada"
              value={produccionAcumulada.toString()}
              helper="unidades producidas"
              icon={<Factory className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
            {/* Top productos más vendidos */}
            <div className="rounded-lg border bg-card shadow-[0_14px_34px_rgba(75,45,30,0.04)]">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h3 className="text-base font-semibold text-foreground">
                  Top productos más vendidos
                </h3>
                <Link
                  href="/reportes"
                  aria-label="Ver estadísticas"
                  className="inline-flex items-center justify-center rounded-md border bg-surface p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                </Link>
              </div>
              {topProductos.length === 0 ? (
                <div className="px-5 py-10 text-sm text-muted-foreground">
                  No hay ventas en este mes.
                </div>
              ) : (
                <ul className="divide-y">
                  {topProductos.map((p, i) => (
                    <li
                      key={p.nombre}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <span className="w-5 text-center text-xs font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {p.nombre}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {p.unidades} u · {formatMoneda(p.total)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
                          <div
                            className="h-full rounded-full bg-gold/70"
                            style={{
                              width: `${Math.max(6, (p.unidades / maxUnidades) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Producto destacado del mes */}
            <div className="relative overflow-hidden rounded-lg border bg-primary p-5 text-primary-foreground shadow-[0_14px_34px_rgba(75,45,30,0.08)]">
              <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_75%_55%,#CDAE86_0_8%,transparent_9%_14%,#7A4A30_15%_28%,transparent_29%),radial-gradient(circle_at_88%_22%,#B8865A_0_7%,transparent_8%),linear-gradient(135deg,#4B2D1E,#7A4A30_55%,#2E1C14)]" />
              <div className="relative max-w-[12rem]">
                <Sparkles className="h-5 w-5 text-gold" />
                <p className="mt-8 text-xs font-semibold text-primary-foreground/75">
                  Producto del mes
                </p>
                <h3 className="mt-2 text-xl font-semibold leading-tight">
                  {topProducto ? topProducto.nombre : "Sin ventas aún"}
                </h3>
                <p className="mt-4 text-sm leading-6 text-primary-foreground/80">
                  {topProducto
                    ? `${topProducto.unidades} unidades vendidas este mes.`
                    : "El más vendido aparecerá aquí cuando registres ventas."}
                </p>
              </div>
              <ChartNoAxesCombined className="absolute bottom-4 right-4 h-24 w-24 text-primary-foreground/10" />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-lg border bg-card p-5 shadow-[0_14px_34px_rgba(75,45,30,0.04)]">
          <BotanicalAccent className="pointer-events-none absolute -right-4 -top-10 h-44 w-28 rotate-6 text-gold/15" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                Taller artesanal
              </p>
              <p className="mt-3 font-serif text-xl leading-8 text-foreground">
                Cada receta cuenta una historia, cada bocado crea un momento.
              </p>
            </div>
            <p className="font-serif text-lg italic text-muted-foreground">
              Delicias Caseras
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  href,
  danger = false,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  href?: string;
  danger?: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-md ${
            danger ? "bg-danger/10 text-danger" : "bg-background text-gold"
          }`}
        >
          {icon}
        </span>
      </div>
      <p
        className={`mt-4 text-2xl font-semibold tabular-nums ${
          danger ? "text-danger" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p
        className={`mt-2 text-xs ${danger ? "text-muted-foreground" : "text-success"}`}
      >
        {helper}
      </p>
    </>
  );

  const className =
    "block rounded-lg border bg-card p-5 shadow-[0_14px_34px_rgba(75,45,30,0.04)]";

  if (href) {
    return (
      <Link
        href={href}
        className={`${className} transition-shadow hover:shadow-[0_18px_40px_rgba(75,45,30,0.10)]`}
      >
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}
