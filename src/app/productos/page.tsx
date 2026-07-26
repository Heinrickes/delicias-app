import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { ProductosGrid } from "@/components/shared/ProductosGrid";
import { ProductFormDialog } from "@/components/shared/ProductFormDialog";
import { DeliciaFormDialog } from "@/components/shared/DeliciaFormDialog";
import { CategoriasManager } from "@/components/shared/CategoriasManager";
import { ActionButton } from "@/components/shared/ActionButton";
import { HistorialTimeline } from "@/components/shared/HistorialTimeline";
import { agruparPorPeriodo, inicialesDe } from "@/lib/historial";
import { obtenerMapaPerfiles } from "@/lib/actions/perfiles";
import { createClient } from "@/lib/supabase/server";
import { getProductosEnriquecidos } from "@/lib/productos-data";
import { LOCALE } from "@/lib/constants";
import { Package, PackagePlus, Plus, Tags } from "lucide-react";

export const revalidate = 0;

const DIAS = [
  { key: "7", label: "7 días" },
  { key: "14", label: "14 días" },
  { key: "30", label: "30 días" },
  { key: "90", label: "90 días" },
] as const;

type Produccion = {
  cantidad: number;
  nota: string | null;
  fecha: string;
  productos: { nombre: string } | null;
  creado_por: string | null;
};

async function getData(dias: number) {
  const supabase = await createClient();
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  desde.setHours(0, 0, 0, 0);

  const [productos, categoriasRes, produccionRes, perfiles] = await Promise.all([
    getProductosEnriquecidos(),
    supabase.from("categorias").select("id, nombre").order("nombre"),
    supabase
      .from("movimientos_stock")
      .select("cantidad, nota, fecha, productos(nombre), creado_por")
      .eq("tipo", "produccion")
      .gte("fecha", desde.toISOString())
      .order("fecha", { ascending: false })
      .limit(30),
    obtenerMapaPerfiles(),
  ]);

  return {
    productos,
    categorias: categoriasRes.data ?? [],
    produccion: (produccionRes.data ?? []) as Produccion[],
    perfiles,
  };
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const { dias: diasParam } = await searchParams;
  const diasKey = DIAS.some((d) => d.key === diasParam) ? diasParam! : "30";
  const dias = parseInt(diasKey);

  const { productos, categorias, produccion, perfiles } = await getData(dias);

  const chipsProduccion = agruparPorPeriodo(produccion).map((b) => ({
    key: b.key,
    label: b.label,
    count: b.items.length,
    amountLabel: `${b.items.reduce((s, m) => s + m.cantidad, 0)} u`,
    eventos: b.items.map((m, i) => ({
      id: `${b.key}-${i}`,
      descripcion: (m.productos?.nombre ?? "Producto eliminado") + (m.nota ? ` · ${m.nota}` : ""),
      when: new Date(m.fecha).toLocaleDateString(LOCALE, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      amount: `+${m.cantidad}`,
      amountTone: "pos" as const,
      author: inicialesDe(m.creado_por ? perfiles[m.creado_por] : null),
    })),
  }));
  const productosSimples = productos
    .filter((p) => p.tipo === "simple")
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      costo: p.costo,
      stock: p.stock,
    }));

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Catálogo
            </p>
            <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
              Productos
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Tu catálogo: productos, delicias, categorías, precios y costos. Repón
              el stock de cada producto desde su tarjeta cuando se acabe.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:w-auto sm:justify-end sm:gap-1">
            <DeliciaFormDialog
              productos={productosSimples}
              categorias={categorias}
              trigger={
                <ActionButton
                  icon={<PackagePlus className="h-6 w-6" />}
                  label="Crear delicia"
                  color="terracota"
                  disabled={productosSimples.length === 0}
                  className="sm:w-28"
                />
              }
            />
            <CategoriasManager
              categorias={categorias}
              trigger={
                <ActionButton icon={<Tags className="h-6 w-6" />} label="Categorías" color="gold" className="sm:w-28" />
              }
            />
            <ProductFormDialog
              categorias={categorias}
              trigger={
                <ActionButton icon={<Plus className="h-6 w-6" />} label="Nuevo producto" color="primary" className="sm:w-28" />
              }
            />
          </div>
        </header>

        {productos.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              No hay productos en el inventario
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Agrega tu primer producto con el botón "Nuevo producto".
            </p>
          </div>
        ) : (
          <ProductosGrid productos={productos} categorias={categorias} />
        )}

        {/* Producción registrada */}
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Producción registrada ({produccion.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {DIAS.map((d) => (
                <Link
                  key={d.key}
                  href={`/productos?dias=${d.key}`}
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
          {produccion.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
              No registraste producción en los últimos {dias} días.
            </div>
          ) : (
            <HistorialTimeline chips={chipsProduccion} />
          )}
        </section>
      </div>
    </AppShell>
  );
}
