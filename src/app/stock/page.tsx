import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { Badge } from "@/components/ui/badge";
import { StockGrid } from "@/components/shared/StockGrid";
import { AgendarProduccionDialog } from "@/components/shared/AgendarProduccionDialog";
import { createClient } from "@/lib/supabase/server";
import { formatMoneda, LOCALE } from "@/lib/constants";
import {
  ChefHat,
  Coins,
  PackageCheck,
  AlertTriangle,
  Factory,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

export const revalidate = 0;

const DIAS = [
  { key: "7", label: "7 días" },
  { key: "14", label: "14 días" },
  { key: "30", label: "30 días" },
  { key: "90", label: "90 días" },
] as const;

type ProductoStock = {
  id: string;
  nombre: string;
  categoria: string | null;
  stock: number;
  stock_minimo: number;
  costo: number;
  unidad: string;
};

type Produccion = {
  cantidad: number;
  nota: string | null;
  fecha: string;
  productos: { nombre: string } | null;
};

async function getData(dias: number) {
  const supabase = await createClient();
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  desde.setHours(0, 0, 0, 0);

  const [productosRes, ventasRes, produccionRes] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, categoria, stock, stock_minimo, costo, unidad")
      .eq("activo", true)
      .eq("tipo", "simple") // las delicias no tienen stock propio (es derivado)
      .order("nombre"),
    supabase
      .from("ventas")
      .select("nombre_producto, cantidad")
      .gte("fecha", desde.toISOString()),
    supabase
      .from("movimientos_stock")
      .select("cantidad, nota, fecha, productos(nombre)")
      .eq("tipo", "produccion")
      .gte("fecha", desde.toISOString())
      .order("fecha", { ascending: false })
      .limit(30),
  ]);

  const ventas = ventasRes.data ?? [];

  // Rotación: unidades vendidas por producto en el período.
  const porProducto = new Map<string, number>();
  for (const v of ventas) {
    porProducto.set(
      v.nombre_producto,
      (porProducto.get(v.nombre_producto) ?? 0) + v.cantidad
    );
  }
  const rotacion = [...porProducto.entries()]
    .map(([nombre, unidades]) => ({ nombre, unidades }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 8);

  const produccion = (produccionRes.data ?? []) as Produccion[];
  const produccionTotal = produccion.reduce((s, m) => s + m.cantidad, 0);

  return {
    productos: (productosRes.data ?? []) as ProductoStock[],
    rotacion,
    produccion,
    produccionTotal,
  };
}

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const { dias: diasParam } = await searchParams;
  const diasKey = DIAS.some((d) => d.key === diasParam) ? diasParam! : "30";
  const dias = parseInt(diasKey);

  const { productos, rotacion, produccion, produccionTotal } =
    await getData(dias);

  const totalUnidades = productos.reduce((s, p) => s + p.stock, 0);
  const valorInventario = productos.reduce((s, p) => s + p.costo * p.stock, 0);
  const stockBajo = productos
    .filter((p) => p.stock < p.stock_minimo)
    .sort((a, b) => a.stock - b.stock);
  const maxRotacion = rotacion[0]?.unidades ?? 0;

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Información
            </p>
            <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
              Inventario
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Resumen de existencias, producción y rotación. Para reponer stock,
              ve a{" "}
              <Link href="/productos" className="text-primary hover:underline">
                Productos
              </Link>
              .
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AgendarProduccionDialog
              productos={productos.map((p) => ({ id: p.id, nombre: p.nombre }))}
              trigger={
                <button type="button" className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-primary/10">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    <ChefHat className="h-6 w-6" />
                  </span>
                  <span className="text-[11px] font-semibold text-primary">Agendar prod.</span>
                </button>
              }
            />
            <div className="flex flex-wrap gap-2">
              {DIAS.map((d) => (
                <Link
                  key={d.key}
                  href={`/stock?dias=${d.key}`}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    d.key === diasKey
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"
                  }`}
                >
                  {d.label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Metric
            label="Unidades en stock"
            value={totalUnidades.toString()}
            icon={<PackageCheck className="h-4 w-4" />}
          />
          <Metric
            label="Valor del inventario"
            value={formatMoneda(valorInventario)}
            icon={<Coins className="h-4 w-4" />}
          />
          <Metric
            label={`Producción (${dias}d)`}
            value={produccionTotal.toString()}
            icon={<Factory className="h-4 w-4" />}
          />
          <Metric
            label="Stock bajo"
            value={stockBajo.length.toString()}
            danger={stockBajo.length > 0}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Más rotación */}
          <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-background text-gold">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-semibold leading-tight text-foreground">
                  Más rotación
                </h3>
                <p className="text-xs text-muted-foreground">
                  Unidades vendidas · últimos {dias} días
                </p>
              </div>
            </div>
            {rotacion.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin ventas en el período.
              </p>
            ) : (
              <ul className="space-y-3">
                {rotacion.map((r, i) => (
                  <li key={r.nombre} className="flex items-center gap-3">
                    <span className="w-4 text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {r.nombre}
                        </span>
                        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                          {r.unidades} u
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background">
                        <div
                          className="h-full rounded-full bg-gold/70"
                          style={{
                            width: `${Math.max(6, (r.unidades / maxRotacion) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Stock bajo */}
          <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="mb-4 flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-md ${
                  stockBajo.length > 0
                    ? "bg-danger/10 text-danger"
                    : "bg-background text-success"
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-semibold leading-tight text-foreground">
                  Stock bajo
                </h3>
                <p className="text-xs text-muted-foreground">
                  Bajo su umbral · repón en Productos
                </p>
              </div>
            </div>
            {stockBajo.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Todo el inventario está en orden.
              </p>
            ) : (
              <ul className="divide-y">
                {stockBajo.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {p.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.categoria ?? "—"}
                      </p>
                    </div>
                    <Badge
                      className={
                        p.stock <= 0
                          ? "bg-danger/15 text-danger"
                          : "bg-gold/15 text-gold"
                      }
                    >
                      {p.stock} / {p.stock_minimo} {p.unidad}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Producción del período */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Producción registrada ({produccion.length})
            </h3>
          </div>
          {produccion.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
              No registraste producción en los últimos {dias} días.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              <div className="divide-y">
                {produccion.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 px-5 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {m.productos?.nombre ?? "Producto eliminado"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {new Date(m.fecha).toLocaleDateString(LOCALE, {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {m.nota ? ` · ${m.nota}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-success">
                      +{m.cantidad}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Inventario completo — cards tapeables */}
        <section>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Inventario actual ({productos.length})
          </h3>
          {productos.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
              No hay productos. Agrégalos en Productos.
            </div>
          ) : (
            <StockGrid productos={productos} />
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  icon,
  danger = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
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
    </div>
  );
}
