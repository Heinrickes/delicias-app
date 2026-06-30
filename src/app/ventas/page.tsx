import { AppShell } from "@/components/shared/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getProductosEnriquecidos } from "@/lib/productos-data";
import { VentasView } from "./VentasView";

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
      <VentasView productos={catalogo.productos} clientes={catalogo.clientes} />
    </AppShell>
  );
}
