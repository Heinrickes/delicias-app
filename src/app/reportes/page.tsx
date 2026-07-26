import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { TabsEstadisticas } from "@/components/shared/TabsEstadisticas";
import { createClient } from "@/lib/supabase/server";
import { obtenerMapaPerfiles } from "@/lib/actions/perfiles";
import { LOCALE } from "@/lib/constants";

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
  creado_por: string | null;
  modo_pago: string | null;
};

function claveDia(fechaISO: string) {
  return new Date(fechaISO).toLocaleDateString("en-CA");
}

function claveMes(fechaISO: string) {
  const d = new Date(fechaISO);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ultimosMeses(n: number) {
  const hoy = new Date();
  const meses: { clave: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push({
      clave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString(LOCALE, { month: "short", year: "2-digit" }),
    });
  }
  return meses;
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

  let comprasQ = supabase
    .from("compras")
    .select("id, nombre, total, estado, proveedor, fecha_completada, fecha_planificada, items, creado_por")
    .in("estado", ["completado", "planificado"])
    .order("creado_en", { ascending: false })
    .limit(50);
  if (desde) comprasQ = comprasQ.gte("creado_en", desde.toISOString());

  // B3: comparativo gasto en compras vs. costo de lo vendido — siempre últimos 6 meses,
  // independiente del selector de rango por días.
  const seisMesesAtras = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);

  const [
    ventasRes,
    prodRes,
    productosRes,
    hoyRes,
    mesRes,
    transRes,
    insumosRes,
    comprasRes,
    porCobrarRes,
    pedidosEstadoRes,
    comprasMensualRes,
    ventasMensualRes,
    perfiles,
  ] = await Promise.all([
    ventasQ,
    prodQ,
    supabase
      .from("productos")
      .select("stock, costo, stock_minimo")
      .eq("activo", true)
      .eq("tipo", "simple"),
    supabase.from("ventas").select("total").gte("fecha", inicioHoy.toISOString()),
    supabase.from("ventas").select("total").gte("fecha", inicioMes.toISOString()),
    supabase
      .from("ventas")
      .select(
        "id, nombre_producto, cantidad, total, costo_total, fecha, pedido_id, clientes(nombre), creado_por, modo_pago"
      )
      .order("fecha", { ascending: false })
      .limit(50),
    supabase
      .from("insumos")
      .select("id, nombre, unidad, stock, stock_minimo, costo_unitario")
      .eq("activo", true)
      .order("nombre"),
    comprasQ,
    supabase
      .from("pedidos")
      .select("total, fecha_estimada_pago")
      .eq("estado", "por_cobrar"),
    supabase.from("pedidos").select("estado"),
    supabase
      .from("compras")
      .select("total, fecha_completada")
      .eq("estado", "completado")
      .gte("fecha_completada", seisMesesAtras.toISOString().slice(0, 10)),
    supabase
      .from("ventas")
      .select("total, costo_total, fecha")
      .gte("fecha", seisMesesAtras.toISOString()),
    obtenerMapaPerfiles(),
  ]);

  const ventas = ventasRes.data ?? [];
  const produccion = (prodRes.data ?? []) as {
    fecha: string;
    cantidad: number;
    productos: { nombre: string } | null;
  }[];
  const productos = productosRes.data ?? [];
  const porCobrar = porCobrarRes.data ?? [];
  const pedidosEstados = pedidosEstadoRes.data ?? [];
  const pedidosPendientes = pedidosEstados.filter((p) => p.estado === "pendiente").length;
  const pedidosPagados = pedidosEstados.filter((p) => p.estado === "entregado").length;
  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);
  const porCobrarVencidos = porCobrar.filter(
    (p) =>
      p.fecha_estimada_pago !== null &&
      new Date(p.fecha_estimada_pago + "T23:59:59") < finHoy
  );

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

  const porVendido = new Map<string, number>();
  for (const v of ventas)
    porVendido.set(v.nombre_producto, (porVendido.get(v.nombre_producto) ?? 0) + v.cantidad);
  const topVendidos = [...porVendido.entries()]
    .map(([nombre, unidades]) => ({ nombre, unidades }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 10);

  const porProducido = new Map<string, number>();
  for (const m of produccion) {
    const nombre = m.productos?.nombre ?? "—";
    porProducido.set(nombre, (porProducido.get(nombre) ?? 0) + m.cantidad);
  }
  const topProducidos = [...porProducido.entries()]
    .map(([nombre, unidades]) => ({ nombre, unidades }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 10);

  const compras = (comprasRes.data ?? []) as {
    id: string;
    nombre: string | null;
    total: number;
    estado: string;
    proveedor: string | null;
    fecha_completada: string | null;
    fecha_planificada: string | null;
    items: { nombre: string; cantidad: number; precio_unitario: number }[];
    creado_por: string | null;
  }[];

  // B3: gasto en compras vs. costo de lo vendido, por mes (últimos 6 meses).
  const meses = ultimosMeses(6);
  const gastoPorMes = new Map<string, number>();
  for (const c of comprasMensualRes.data ?? []) {
    if (!c.fecha_completada) continue;
    const k = c.fecha_completada.slice(0, 7);
    gastoPorMes.set(k, (gastoPorMes.get(k) ?? 0) + c.total);
  }
  const costoVendidoPorMes = new Map<string, number>();
  const ventasTotalPorMes = new Map<string, number>();
  for (const v of ventasMensualRes.data ?? []) {
    const k = claveMes(v.fecha);
    costoVendidoPorMes.set(k, (costoVendidoPorMes.get(k) ?? 0) + v.costo_total);
    ventasTotalPorMes.set(k, (ventasTotalPorMes.get(k) ?? 0) + v.total);
  }
  const compraVsVenta = meses.map((m) => ({
    mes: m.label,
    gastoCompras: gastoPorMes.get(m.clave) ?? 0,
    costoVendido: costoVendidoPorMes.get(m.clave) ?? 0,
  }));
  const gastoCompras6m = compraVsVenta.reduce((s, m) => s + m.gastoCompras, 0);
  const costoVendido6m = compraVsVenta.reduce((s, m) => s + m.costoVendido, 0);
  const ventasTotal6m = [...ventasTotalPorMes.values()].reduce((s, v) => s + v, 0);
  const margenBruto6m = ventasTotal6m - costoVendido6m;

  return {
    transacciones: (transRes.data ?? []) as Transaccion[],
    ventasPorDia,
    produccionPorDia,
    topVendidos,
    topProducidos,
    insumos: insumosRes.data ?? [],
    compras,
    compraVsVenta,
    metrics: {
      totalRango: ventas.reduce((s, v) => s + v.total, 0),
      margenRango: ventas.reduce((s, v) => s + (v.total - v.costo_total), 0),
      unidadesRango: ventas.reduce((s, v) => s + v.cantidad, 0),
      ventasHoy: (hoyRes.data ?? []).reduce((s, v) => s + v.total, 0),
      ventasMes: (mesRes.data ?? []).reduce((s, v) => s + v.total, 0),
      stockTotal: productos.reduce((s, p) => s + p.stock, 0),
      valorStock: productos.reduce((s, p) => s + p.stock * p.costo, 0),
      productosStockBajo: productos.filter((p) => p.stock < p.stock_minimo).length,
      porCobrarTotal: porCobrar.reduce((s, p) => s + p.total, 0),
      porCobrarCount: porCobrar.length,
      porCobrarVencidoTotal: porCobrarVencidos.reduce((s, p) => s + p.total, 0),
      porCobrarVencidoCount: porCobrarVencidos.length,
      pedidosPendientes,
      pedidosPagados,
      gastoCompras6m,
      costoVendido6m,
      margenBruto6m,
    },
    nDias,
    perfiles,
  };
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string; tab?: string }>;
}) {
  const { rango: rangoParam, tab: tabParam } = await searchParams;
  const rango: RangoKey = RANGOS.some((r) => r.key === rangoParam)
    ? (rangoParam as RangoKey)
    : "30d";
  const initialTab =
    tabParam === "ventas" || tabParam === "inventario" || tabParam === "costos"
      ? tabParam
      : undefined;

  const data = await getData(rango);

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

        <TabsEstadisticas {...data} initialTab={initialTab} />
      </div>
    </AppShell>
  );
}
