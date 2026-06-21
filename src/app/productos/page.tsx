import { AppShell } from "@/components/shared/AppShell";
import { ProductCard } from "@/components/shared/ProductCard";
import { ProductForm } from "@/components/shared/ProductForm";
import { PackFormDialog } from "@/components/shared/PackFormDialog";
import { Button } from "@/components/ui/button";
import { getProductosEnriquecidos } from "@/lib/productos-data";
import { Package, PackagePlus } from "lucide-react";

export const revalidate = 0;

export default async function ProductosPage() {
  const productos = await getProductosEnriquecidos();
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
              Tu catálogo: productos, packs, precios y costos. Repón el stock
              de cada producto desde su tarjeta cuando se acabe.
            </p>
          </div>
          <PackFormDialog
            productos={productosSimples}
            trigger={
              <Button variant="outline" disabled={productosSimples.length === 0}>
                <PackagePlus className="h-4 w-4" />
                Crear pack
              </Button>
            }
          />
        </header>

        <ProductForm />

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
      </div>
    </AppShell>
  );
}
