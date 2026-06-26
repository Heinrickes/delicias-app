import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { TiendaVenta } from "@/components/shared/TiendaVenta";
import { createClient } from "@/lib/supabase/server";
import { getProductosEnriquecidos } from "@/lib/productos-data";
import { BarChart3 } from "lucide-react";

export const revalidate = 0;

async function getCatalogo() {
  const supabase = await createClient();
  const [productos, clientesRes] = await Promise.all([
    getProductosEnriquecidos(),
    supabase.from("clientes").select("id, nombre").order("nombre"),
  ]);
  return {
    productos: productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      stock: p.stock,
      categoria: p.categoria,
      imagen_url: p.imagen_url,
      tipo: p.tipo,
      componentes: p.componentes,
    })),
    clientes: clientesRes.data ?? [],
  };
}

export default async function VentasPage() {
  const catalogo = await getCatalogo();

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Tienda
            </p>
            <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
              Vender
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Toca un producto para agregarlo a la bolsa y cierra la venta.
            </p>
          </div>
          <Link
            href="/reportes"
            className="inline-flex items-center gap-2 self-start rounded-lg border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:self-auto"
          >
            <BarChart3 className="h-4 w-4" />
            Historial y reportes
          </Link>
        </header>

        <TiendaVenta
          productos={catalogo.productos}
          clientes={catalogo.clientes}
        />
      </div>
    </AppShell>
  );
}
