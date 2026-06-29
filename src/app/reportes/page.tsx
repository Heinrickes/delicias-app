import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import {
  ProduccionChart,
  TopProductosChart,
  VentasChart,
} from "@/components/shared/ReportesCharts";
import { SeccionReporte } from "@/components/shared/SeccionReporte";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatMoneda, LOCALE } from "@/lib/constants";
import { Receipt, TrendingUp, Calendar, CalendarDays, Boxes } from "lucide-react";

export const revalidate = 0;

const RANGOS = [
  { key: "7d", label: "7 días", dias: 7 },
  { key: "30d", label: "30 días", dias: 30 },
  { key: "90d", label: "90 días", dias: 90 },
  { key: "todo", label: "Todo", dias: 0 },
] as const;

type RangoKey = (typeof RANGOS)[number]["key"];

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

function claveDia(fechaISO: string) {
  return new Date(fechaISO).toLocaleDateString("en-CA");
}

function ultimosDias(n: number) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias: { clave: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);
    dias.push({
      clave: d.toLocaleDateString("en-CA"),
      label: d.toLocaleDateString(LOCALE, { day: "2-digit", month: "short" }),
    });
  }
  return dias;
}

async function getData(rango: RangoKey) {
  const supabase = await createClient();
  const cfg = RANGOS.find((r) => r.key === rango)!;

  const ahora = new Date();
  const inicioHoy = new Date(ahora);
  inicioHoy.setHours(0, 0, 0, 0);
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const desde = cfg.dias > 0 ? new Date(ahora) : null;
  if (desde) {
    desde.setDate(ahora.getDate() - cfg.dias);
    desde.setHours(0, 0, 0, 0);
  }

  let ventasQ = supabase
    .from("ventas")
    .select("fecha, total, costo_total, nombre_producto, cantidad");
  if (desde) ventasQ = ventasQ.gte("fecha", desde.toISOString());

  let prodQ = supabase
    .from("movimientos_stock")
    .select("fecha, cantidad, productos(nombre)")
    .eq("tipo", "produccion");
  if (desde) prodQ = prodQ.gte("fecha", desde.toISOString());

  const [ventasRes, prodRes, productosRes, hoyRes, mesRes, transRes] =
    await Promise.all([
      ventasQ,
      prodQ,
      supabase
        .from("productos")
        .select("stock, costo")
        .eq("activo", true)
        .eq("tipo", "simple"),
      supabase.from("ventas").select("total").gte("fecha", inicioHoy.toISOString()),
      supabase.from("ventas").select("total").gte("fecha", inicioMes.toISOString()),
      supabase
        .from("ventas")
        .select(
          "id, nombre_producto, cantidad, total, costo_total, fecha, pedido_id, clientes(nombre)"
        )
        .order("fecha", { ascending: false })
        .limit(50),
    ]);

  const ventas = ventasRes.data ?? [];
  const produccion = (prodRes.data ?? []) as {
    fecha: string;
    cantidad: number;
    productos: { nombre: string } | null;
  }[];
  const productos = productosRes.data ?? [];

  // Serie diaria (gráfico) — acotada para legibilidad.
  const nDias = cfg.dias > 0 ? Math.min(cfg.dias, 30) : 30;
  const dias = ultimosDias(nDias);
  const porDia = new Map<string, { ingresos: number; costos: number }>();
  for (const v of ventas) {
    const k = claveDia(v.fecha);
    const acc = porDia.get(k) ?? { ingresos: 0, costos: 0 };
    acc.ingresos += v.total;
    acc.costos += v.costo_total;
    porDia.set(k, acc);
  }
  const ventasPorDia = dias.map((d) => ({
    dia: d.label,
    ingresos: porDia.get(d.clave)?.ingresos ?? 0,
    costos: porDia.get(d.clave)?.costos ?? 0,
  }));

  const prodPorDia = new Map<string, number>();
  for (const m of produccion) {
    const k = claveDia(m.fecha);
    prodPorDia.set(k, (prodPorDia.get(k) ?? 0) + m.cantidad);
  }
  const produccionPorDia = dias.map((d) => ({
    dia: d.label,
    cantidad: prodPorDia.get(d.clave) ?? 0,
  }));

  // Top vendidos
  const porVendido = new Map<string, number>();
  for (const v of ventas)
    porVendido.set(v.nombre_producto, (porVendido.get(v.nombre_producto) ?? 0) + v.cantidad);
  const topVendidos = [...porVendido.entries()]
    .map(([nombre, unidades]) => ({ nombre, unidades }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 10);

  // Top producidos
  const porProducido = new Map<string, number>();
  for (const m of produccion) {
    const nombre = m.productos?.nombre ?? "—";
    porProducido.set(nombre, (porProducido.get(nombre) ?? 0) + m.cantidad);
  }
  const topProducidos = [...porProducido.entries()]
    .map(([nombre, unidades]) => ({ nombre, unidades }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 10);

  return {
    transacciones: (transRes.data ?? []) as Transaccion[],
    ventasPorDia,
    produccionPorDia,
    topVendidos,
    topProducidos,
    metrics: {
      totalRango: ventas.reduce((s, v) => s + v.total, 0),
      margenRango: ventas.reduce((s, v) => s + (v.total - v.costo_total), 0),
      unidadesRango: ventas.reduce((s, v) => s + v.cantidad, 0),
      ventasHoy: (hoyRes.data ?? []).reduce((s, v) => s + v.total, 0),
      ventasMes: (mesRes.data ?? []).reduce((s, v) => s + v.total, 0),
      stockTotal: productos.reduce((s, p) => s + p.stock, 0),
      valorStock: productos.reduce((s, p) => s + p.stock * p.costo, 0),
    },
    nDias,
  };
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string }>;
}) {
  const { rango: rangoParam } = await searchParams;
  const rango: RangoKey = RANGOS.some((r) => r.key === rangoParam)
    ? (rangoParam as RangoKey)
    : "30d";

  const {
    transacciones,
    ventasPorDia,
    produccionPorDia,
    topVendidos,
    topProducidos,
    metrics,
    nDias,
  } = await getData(rango);

  const margenPct =
    metrics.totalRango > 0
      ? Math.round((metrics.margenRango / metrics.totalRango) * 100)
      : 0;

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Estadísticas
            </p>
            <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
              Estadísticas
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Ventas, márgenes, rotación y producción. Cambia el período y alterna
              entre gráfico y lista.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {RANGOS.map((r) => (
              <Link
                key={r.key}
                href={`/reportes?rango=${r.key}`}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  r.key === rango
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"
                }`}
              >
                {r.label}
              </Link>
            ))}
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
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
            label="Stock total"
            value={`${metrics.stockTotal} u`}
            helper={formatMoneda(metrics.valorStock)}
            icon={<Boxes className="h-4 w-4" />}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
        </section>

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
    </AppShell>
  );
}

function Metric({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-background text-gold">
          {icon}
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {helper && <p className="mt-1 text-xs text-success">{helper}</p>}
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
