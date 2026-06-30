import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { TabsEstadisticas } from "@/components/shared/TabsEstadisticas";
import { createClient } from "@/lib/supabase/server";
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

  let comprasQ = supabase
    .from("compras")
    .select("id, total, estado, proveedor, fecha_completada, fecha_planificada, items")
    .in("estado", ["completado", "planificado"])
    .order("creado_en", { ascending: false })
    .limit(50);
  if (desde) comprasQ = comprasQ.gte("creado_en", desde.toISOString());

  const [ventasRes, prodRes, productosRes, hoyRes, mesRes, transRes, insumosRes, comprasRes] =
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
      supabase
        .from("insumos")
        .select("id, nombre, unidad, stock, stock_minimo, costo_unitario")
        .eq("activo", true)
        .order("nombre"),
      comprasQ,
    ]);

  const ventas = ventasRes.data ?? [];
  const produccion = (prodRes.data ?? []) as {
    fecha: string;
    cantidad: number;
    productos: { nombre: string } | null;
  }[];
  const productos = productosRes.data ?? [];

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
    total: number;
    estado: string;
    proveedor: string | null;
    fecha_completada: string | null;
    fecha_planificada: string | null;
    items: { nombre: string; cantidad: number; precio_unitario: number }[];
  }[];

  return {
    transacciones: (transRes.data ?? []) as Transaccion[],
    ventasPorDia,
    produccionPorDia,
    topVendidos,
    topProducidos,
    insumos: insumosRes.data ?? [],
    compras,
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

        <TabsEstadisticas {...data} />
      </div>
    </AppShell>
  );
}
