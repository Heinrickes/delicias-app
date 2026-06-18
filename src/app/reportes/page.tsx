import { AppShell } from "@/components/shared/AppShell";
import {
  ProduccionChart,
  TopProductosChart,
  VentasChart,
} from "@/components/shared/ReportesCharts";
import { createClient } from "@/lib/supabase/server";
import { formatMoneda, LOCALE } from "@/lib/constants";

export const revalidate = 0;

function claveDia(fechaISO: string) {
  return new Date(fechaISO).toLocaleDateString("en-CA"); // YYYY-MM-DD local
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

async function getData() {
  const supabase = await createClient();
  const desde = new Date();
  desde.setDate(desde.getDate() - 30);
  desde.setHours(0, 0, 0, 0);

  const [ventasRes, produccionRes] = await Promise.all([
    supabase
      .from("ventas")
      .select("fecha, total, costo_total, nombre_producto, cantidad")
      .gte("fecha", desde.toISOString()),
    supabase
      .from("movimientos_stock")
      .select("fecha, cantidad")
      .eq("tipo", "produccion")
      .gte("fecha", desde.toISOString()),
  ]);

  const ventas = ventasRes.data ?? [];
  const produccion = produccionRes.data ?? [];

  const dias = ultimosDias(14);

  // Ventas por día (ingresos / costos)
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

  // Producción por día
  const prodPorDia = new Map<string, number>();
  for (const m of produccion) {
    const k = claveDia(m.fecha);
    prodPorDia.set(k, (prodPorDia.get(k) ?? 0) + m.cantidad);
  }
  const produccionPorDia = dias.map((d) => ({
    dia: d.label,
    cantidad: prodPorDia.get(d.clave) ?? 0,
  }));

  // Top productos
  const porProducto = new Map<string, number>();
  for (const v of ventas) {
    porProducto.set(
      v.nombre_producto,
      (porProducto.get(v.nombre_producto) ?? 0) + v.cantidad
    );
  }
  const topProductos = [...porProducto.entries()]
    .map(([nombre, unidades]) => ({ nombre, unidades }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 6);

  const ingresos = ventas.reduce((s, v) => s + v.total, 0);
  const costos = ventas.reduce((s, v) => s + v.costo_total, 0);
  const unidades = ventas.reduce((s, v) => s + v.cantidad, 0);
  const produccionTotal = produccion.reduce((s, m) => s + m.cantidad, 0);

  return {
    ventasPorDia,
    produccionPorDia,
    topProductos,
    resumen: {
      ingresos,
      costos,
      margen: ingresos - costos,
      margenPct: ingresos > 0 ? Math.round(((ingresos - costos) / ingresos) * 100) : 0,
      unidades,
      produccionTotal,
    },
  };
}

export default async function ReportesPage() {
  const { ventasPorDia, produccionPorDia, topProductos, resumen } =
    await getData();

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Estadísticas · últimos 30 días
          </p>
          <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
            Reportes
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Ventas, márgenes y producción del taller en un vistazo.
          </p>
        </header>

        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Metric label="Ingresos" value={formatMoneda(resumen.ingresos)} />
          <Metric
            label="Margen"
            value={formatMoneda(resumen.margen)}
            helper={`${resumen.margenPct}%`}
          />
          <Metric label="Unidades vendidas" value={resumen.unidades.toString()} />
          <Metric
            label="Producción"
            value={resumen.produccionTotal.toString()}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            titulo="Ingresos vs costos"
            subtitulo="Últimos 14 días"
          >
            <VentasChart data={ventasPorDia} />
          </ChartCard>
          <ChartCard titulo="Productos más vendidos" subtitulo="Por unidades">
            {topProductos.length === 0 ? (
              <EmptyChart />
            ) : (
              <TopProductosChart data={topProductos} />
            )}
          </ChartCard>
        </section>

        <ChartCard titulo="Producción de stock" subtitulo="Últimos 14 días">
          <ProduccionChart data={produccionPorDia} />
        </ChartCard>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {helper && <p className="mt-1 text-xs text-success">{helper} de margen</p>}
    </div>
  );
}

function ChartCard({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="mb-4">
        <h3 className="font-serif text-lg text-foreground">{titulo}</h3>
        <p className="text-xs text-muted-foreground">{subtitulo}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      Aún no hay datos suficientes.
    </div>
  );
}
