import { supabase } from "@/lib/supabase";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { ProductCard } from "@/components/shared/ProductCard";
import { ProductForm } from "@/components/shared/ProductForm";
import {
  AlertTriangle,
  ChartNoAxesCombined,
  Package,
  Receipt,
  Sparkles,
  TrendingUp,
} from "lucide-react";

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
};

type Venta = {
  id: string;
  nombre_producto: string;
  cantidad: number;
  total: number;
  fecha: string;
};

async function getProductos() {
  const { data: productos, error } = await supabase
    .from("productos")
    .select("id, nombre, precio, stock")
    .eq("activo", true)
    .order("nombre");

  if (error) console.error("Error trayendo productos:", error);
  return (productos ?? []) as Producto[];
}

async function getVentas() {
  const { data: ventas, error } = await supabase
    .from("ventas")
    .select("id, nombre_producto, cantidad, total, fecha")
    .order("fecha", { ascending: false })
    .limit(8);

  if (error) console.error("Error trayendo ventas:", error);
  return (ventas ?? []) as Venta[];
}

export default async function Home() {
  const [productos, ventas] = await Promise.all([getProductos(), getVentas()]);
  const totalStock = productos.reduce((sum, p) => sum + p.stock, 0);
  const lowStockProducts = productos.filter((p) => p.stock < 10);
  const today = new Date().toDateString();
  const ventasHoy = ventas.filter(
    (venta) => new Date(venta.fecha).toDateString() === today
  );
  const ingresoHoy = ventasHoy.reduce((sum, venta) => sum + venta.total, 0);
  const unidadesHoy = ventasHoy.reduce((sum, venta) => sum + venta.cantidad, 0);
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
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Ventas hoy"
            value={`$${ingresoHoy.toLocaleString("es-CL")}`}
            helper="+12% vs ayer"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            label="Pedidos"
            value={unidadesHoy.toString()}
            helper="+2 vs ayer"
            icon={<Receipt className="h-4 w-4" />}
          />
          <MetricCard
            label="Productos"
            value={productos.length.toString()}
            helper="+1 nuevo"
            icon={<Package className="h-4 w-4" />}
          />
          <MetricCard
            label="Stock bajo"
            value={lowStockProducts.length.toString()}
            helper={`${totalStock} unidades totales`}
            danger={lowStockProducts.length > 0}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
          <div className="rounded-lg border bg-card shadow-[0_14px_34px_rgba(75,45,30,0.04)]">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-serif text-lg text-foreground">
                Ventas recientes
              </h3>
              <span className="rounded-md border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">
                Ver todas
              </span>
            </div>
            {ventas.length === 0 ? (
              <div className="px-5 py-10 text-sm text-muted">
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
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted">
                        <Receipt className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {venta.nombre_producto}
                        </p>
                        <p className="mt-1 text-xs text-muted">
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

          <div className="relative overflow-hidden rounded-lg border bg-accent p-5 text-accent-foreground shadow-[0_14px_34px_rgba(75,45,30,0.08)]">
            <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_75%_55%,#CDAE86_0_8%,transparent_9%_14%,#7A4A30_15%_28%,transparent_29%),radial-gradient(circle_at_88%_22%,#B8865A_0_7%,transparent_8%),linear-gradient(135deg,#4B2D1E,#7A4A30_55%,#2E1C14)]" />
            <div className="relative max-w-[12rem]">
              <Sparkles className="h-5 w-5 text-gold" />
              <p className="mt-8 text-xs font-semibold text-accent-foreground/75">
                Producto destacado
              </p>
              <h3 className="mt-2 font-serif text-2xl leading-tight">
                {topProducto ? topProducto[0] : "Trufas artesanales"}
              </h3>
              <p className="mt-4 text-sm leading-6 text-accent-foreground/80">
                {topProducto
                  ? `${topProducto[1]} unidades en los ultimos movimientos.`
                  : "Nuestro producto mas vendido aparecera aqui cuando registres ventas."}
              </p>
            </div>
            <ChartNoAxesCombined className="absolute bottom-4 right-4 h-24 w-24 text-accent-foreground/10" />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5 shadow-[0_14px_34px_rgba(75,45,30,0.04)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                Taller artesanal
              </p>
              <p className="mt-3 font-serif text-xl leading-8 text-foreground">
                Cada receta cuenta una historia, cada bocado crea un momento.
              </p>
            </div>
            <p className="font-serif text-lg italic text-muted">
              Delicias Caseras
            </p>
          </div>
        </section>

        <section id="productos" className="scroll-mt-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-serif text-2xl text-foreground">
                Productos
              </h2>
              <p className="mt-1 text-xs text-muted">
                Mostrando {productos.length} productos activos
              </p>
            </div>
            <p className="text-sm text-muted">
              Gestiona altas, precios y ventas rapidas.
            </p>
          </div>

          <ProductForm />

          {productos.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-card p-12 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted">
                No hay productos en el inventario
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Agrega tu primer producto usando el formulario de arriba
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {productos.map((producto, index) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  variant={index % 4}
                />
              ))}
            </div>
          )}
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
  danger = false,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-[0_14px_34px_rgba(75,45,30,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-muted">{label}</p>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-md ${
            danger
              ? "bg-danger/10 text-danger"
              : "bg-background text-gold"
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
      <p className={`mt-2 text-xs ${danger ? "text-muted" : "text-success"}`}>
        {helper}
      </p>
    </div>
  );
}
