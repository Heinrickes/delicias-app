import { AppShell } from "@/components/shared/AppShell";
import { ProductosGrid } from "@/components/shared/ProductosGrid";
import { ProductForm } from "@/components/shared/ProductForm";
import { DeliciaFormDialog } from "@/components/shared/DeliciaFormDialog";
import { CategoriasManager } from "@/components/shared/CategoriasManager";
import { createClient } from "@/lib/supabase/server";
import { getProductosEnriquecidos } from "@/lib/productos-data";
import { Package, PackagePlus, Tags } from "lucide-react";


export const revalidate = 0;

async function getData() {
  const supabase = await createClient();
  const [productos, categoriasRes] = await Promise.all([
    getProductosEnriquecidos(),
    supabase.from("categorias").select("id, nombre").order("nombre"),
  ]);
  return { productos, categorias: categoriasRes.data ?? [] };
}

export default async function ProductosPage() {
  const { productos, categorias } = await getData();
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
          <div className="flex flex-wrap gap-1">
            <CategoriasManager
              categorias={categorias}
              trigger={
                <button type="button" className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-gold/10">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-white shadow">
                    <Tags className="h-6 w-6" />
                  </span>
                  <span className="text-[11px] font-semibold text-gold">Categorías</span>
                </button>
              }
            />
            <DeliciaFormDialog
              productos={productosSimples}
              categorias={categorias}
              trigger={
                <button
                  type="button"
                  disabled={productosSimples.length === 0}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-terracotta/10 disabled:opacity-50"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta text-white shadow">
                    <PackagePlus className="h-6 w-6" />
                  </span>
                  <span className="text-[11px] font-semibold text-terracotta">Crear delicia</span>
                </button>
              }
            />
          </div>
        </header>

        <ProductForm categorias={categorias} />

        {productos.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              No hay productos en el inventario
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Agrega tu primer producto usando el formulario de arriba.
            </p>
          </div>
        ) : (
          <ProductosGrid productos={productos} categorias={categorias} />
        )}
      </div>
    </AppShell>
  );
}
