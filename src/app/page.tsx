import { createClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { getProductosEnriquecidos } from "@/lib/productos-data";
import { formatMoneda } from "@/lib/constants";
import {
  AlertTriangle,
  CalendarClock,
  ChartNoAxesCombined,
  Coins,
  Receipt,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { BotanicalAccent } from "@/components/shared/BotanicalAccent";

type Venta = {
  id: string;
  nombre_producto: string;
  cantidad: number;
  total: number;
  fecha: string;
};

async function getVentasRecientes() {
  const supabase = await createClient();
  const { data: ventas, error } = await supabase
    .from("ventas")
    .select("id, nombre_producto, cantidad, total, fecha")
    .order("fecha", { ascending: false })
    .limit(8);

  if (error) console.error("Error trayendo ventas:", error);
  return (ventas ?? []) as Venta[];
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

  const [ventasRes, pedidosRes] = await Promise.all([
    supabase
      .from("ventas")
      .select("total, cantidad, fecha")
      .gte("fecha", inicioAyer.toISOString()),
    supabase
      .from("pedidos")
      .select("estado, fecha_entrega, total")
      .in("estado", ["pendiente", "por_cobrar"]),
  ]);

  const ventas = ventasRes.data ?? [];
  const pedidos = pedidosRes.data ?? [];
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

  return { ingresoHoy, ingresoAyer, entregasHoy, totalPorCobrar };
}

export default async function Home() {
  const [productos, ventas, resumen] = await Promise.all([
    getProductosEnriquecidos(),
    getVentasRecientes(),
    getResumen(),
  ]);
  const { ingresoHoy, ingresoAyer, entregasHoy, totalPorCobrar } = resumen;
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

  const productoMasVendido = ventas.reduce<Record<string, number>>(
    (acc, venta) => {
      acc[venta.nombre_producto] =
        (acc[venta.nombre_producto] ?? 0) + venta.cantidad;
      return acc;
    },
    {}
  );
  const topProducto = Object.entries(productoMasVendido).sort(
    (a, b) => b[1] - a[1]
  )[0];

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

        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <MetricCard
            label="Ventas hoy"
            value={formatMoneda(ingresoHoy)}
            helper={deltaHelper}
            href="/ventas"
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
            icon={<Coins className="h-4 w-4" />}
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
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
          <div className="rounded-lg border bg-card shadow-[0_14px_34px_rgba(75,45,30,0.04)]">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-serif text-lg text-foreground">
                Ventas recientes
              </h3>
              <Link
                href="/reportes"
                className="rounded-md border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Ver todas
              </Link>
            </div>
            {ventas.length === 0 ? (
              <div className="px-5 py-10 text-sm text-muted-foreground">
                Aun no hay ventas registradas.
              </div>
            ) : (
              <div className="divide-y">
                {ventas.slice(0, 5).map((venta) => (
                  <div
                    key={venta.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
                        <Receipt className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {venta.nombre_producto}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(venta.fecha).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          - {venta.cantidad} unidad
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-success">
                      ${venta.total.toLocaleString("es-CL")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-lg border bg-primary p-5 text-primary-foreground shadow-[0_14px_34px_rgba(75,45,30,0.08)]">
            <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_75%_55%,#CDAE86_0_8%,transparent_9%_14%,#7A4A30_15%_28%,transparent_29%),radial-gradient(circle_at_88%_22%,#B8865A_0_7%,transparent_8%),linear-gradient(135deg,#4B2D1E,#7A4A30_55%,#2E1C14)]" />
            <div className="relative max-w-[12rem]">
              <Sparkles className="h-5 w-5 text-gold" />
              <p className="mt-8 text-xs font-semibold text-primary-foreground/75">
                Producto destacado
              </p>
              <h3 className="mt-2 font-serif text-2xl leading-tight">
                {topProducto ? topProducto[0] : "Trufas artesanales"}
              </h3>
              <p className="mt-4 text-sm leading-6 text-primary-foreground/80">
                {topProducto
                  ? `${topProducto[1]} unidades en los ultimos movimientos.`
                  : "Nuestro producto mas vendido aparecera aqui cuando registres ventas."}
              </p>
            </div>
            <ChartNoAxesCombined className="absolute bottom-4 right-4 h-24 w-24 text-primary-foreground/10" />
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
