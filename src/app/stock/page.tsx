import { AppShell } from "@/components/shared/AppShell";
import {
  InventarioTabla,
  type ProductoInventario,
} from "@/components/shared/InventarioTabla";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  formatMoneda,
  LOCALE,
  TIPOS_MOVIMIENTO,
  type TipoMovimiento,
} from "@/lib/constants";
import { Coins, PackageCheck, AlertTriangle, Factory } from "lucide-react";

export const revalidate = 0;

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
      .select("id, nombre, categoria, stock, stock_minimo, costo, unidad")
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
    productos: (productosRes.data ?? []) as ProductoInventario[],
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
  const valorInventario = productos.reduce((s, p) => s + p.costo * p.stock, 0);
  const stockBajo = productos.filter((p) => p.stock < p.stock_minimo);

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Existencias
          </p>
          <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
            Inventario
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Controla existencias y su valor, registra producción y mermas, y
            define el umbral de aviso de cada producto.
          </p>
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
        {productos.length === 0 ? (
          <EmptyState texto="No hay productos. Agrega productos desde Productos." />
        ) : (
          <InventarioTabla productos={productos} />
        )}

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
