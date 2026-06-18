import { AppShell } from "@/components/shared/AppShell";
import { StockMovimientoDialog } from "@/components/shared/StockMovimientoDialog";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  LOCALE,
  STOCK_BAJO_UMBRAL,
  TIPOS_MOVIMIENTO,
  type TipoMovimiento,
} from "@/lib/constants";
import { Boxes, PackageCheck, AlertTriangle, Factory } from "lucide-react";

export const revalidate = 0;

type ProductoStock = {
  id: string;
  nombre: string;
  categoria: string | null;
  stock: number;
  unidad: string;
};

type Movimiento = {
  id: string;
  tipo: string;
  cantidad: number;
  nota: string | null;
  fecha: string;
  productos: { nombre: string } | null;
};

async function getData() {
  const supabase = await createClient();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [productosRes, movimientosRes, produccionRes] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, categoria, stock, unidad")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("movimientos_stock")
      .select("id, tipo, cantidad, nota, fecha, productos(nombre)")
      .order("fecha", { ascending: false })
      .limit(25),
    supabase
      .from("movimientos_stock")
      .select("cantidad")
      .eq("tipo", "produccion")
      .gte("fecha", inicioMes.toISOString()),
  ]);

  const produccionMes = (produccionRes.data ?? []).reduce(
    (sum, m) => sum + m.cantidad,
    0
  );

  return {
    productos: (productosRes.data ?? []) as ProductoStock[],
    movimientos: (movimientosRes.data ?? []) as Movimiento[],
    produccionMes,
  };
}

const tipoBadge: Record<TipoMovimiento, string> = {
  produccion: "bg-success/15 text-success",
  venta: "bg-primary/10 text-primary",
  ajuste: "bg-gold/15 text-gold",
  merma: "bg-danger/15 text-danger",
};

export default async function StockPage() {
  const { productos, movimientos, produccionMes } = await getData();

  const totalUnidades = productos.reduce((s, p) => s + p.stock, 0);
  const stockBajo = productos.filter((p) => p.stock < STOCK_BAJO_UMBRAL);

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Inventario
          </p>
          <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
            Stock y producción
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Controla las existencias, registra la producción de cada lote y
            revisa el historial de movimientos.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Productos activos"
            value={productos.length.toString()}
            icon={<Boxes className="h-4 w-4" />}
          />
          <Metric
            label="Unidades en stock"
            value={totalUnidades.toString()}
            icon={<PackageCheck className="h-4 w-4" />}
          />
          <Metric
            label="Producción del mes"
            value={produccionMes.toString()}
            icon={<Factory className="h-4 w-4" />}
          />
          <Metric
            label="Stock bajo"
            value={stockBajo.length.toString()}
            danger={stockBajo.length > 0}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        </section>

        {/* Inventario */}
        <section>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Inventario ({productos.length})
          </h3>
          {productos.length === 0 ? (
            <EmptyState texto="No hay productos. Agrega productos desde el Dashboard." />
          ) : (
            <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-3 font-semibold">Producto</th>
                      <th className="px-5 py-3 font-semibold">Categoría</th>
                      <th className="px-5 py-3 text-center font-semibold">
                        Stock
                      </th>
                      <th className="px-5 py-3 text-center font-semibold">
                        Estado
                      </th>
                      <th className="px-5 py-3 text-right font-semibold">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {productos.map((p) => {
                      const agotado = p.stock <= 0;
                      const bajo = p.stock < STOCK_BAJO_UMBRAL;
                      return (
                        <tr key={p.id} className="hover:bg-background/30">
                          <td className="px-5 py-3 font-medium text-foreground">
                            {p.nombre}
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {p.categoria ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-center tabular-nums">
                            {p.stock}{" "}
                            <span className="text-xs text-muted-foreground">
                              {p.unidad}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <Badge
                              className={
                                agotado
                                  ? "bg-danger/15 text-danger"
                                  : bajo
                                    ? "bg-gold/15 text-gold"
                                    : "bg-success/15 text-success"
                              }
                            >
                              {agotado ? "Agotado" : bajo ? "Bajo" : "OK"}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <StockMovimientoDialog producto={p} />
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

        {/* Movimientos */}
        <section>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Movimientos recientes
          </h3>
          {movimientos.length === 0 ? (
            <EmptyState texto="Aún no hay movimientos de stock registrados." />
          ) : (
            <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              <div className="divide-y">
                {movimientos.map((m) => {
                  const tipo = m.tipo as TipoMovimiento;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-4 px-5 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Badge className={tipoBadge[tipo] ?? "bg-muted"}>
                          {TIPOS_MOVIMIENTO[tipo] ?? m.tipo}
                        </Badge>
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
                      <span
                        className={`shrink-0 text-sm font-semibold tabular-nums ${
                          m.cantidad >= 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {m.cantidad >= 0 ? "+" : ""}
                        {m.cantidad}
                      </span>
                    </div>
                  );
                })}
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

function EmptyState({ texto }: { texto: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
      {texto}
    </div>
  );
}
