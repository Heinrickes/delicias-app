import { AppShell } from "@/components/shared/AppShell";
import { type Insumo } from "@/components/shared/CostosManager";
import { createClient } from "@/lib/supabase/server";
import { ComprasView } from "./ComprasView";

export const revalidate = 0;

export default async function CostosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("insumos")
    .select("id, nombre, unidad, stock, stock_minimo, costo_unitario, proveedor, en_lista")
    .eq("activo", true)
    .order("nombre");

  const insumos = (data ?? []) as Insumo[];
  const valor = insumos.reduce((s, i) => s + i.stock * i.costo_unitario, 0);
  const porComprar = insumos.filter(
    (i) => i.stock < i.stock_minimo || i.en_lista
  ).length;

  const insumosParaTienda = insumos.map((i) => ({
    id: i.id,
    nombre: i.nombre,
    unidad: i.unidad,
    costo_unitario: i.costo_unitario,
    en_lista: i.en_lista,
    stock: i.stock,
    stock_minimo: i.stock_minimo,
  }));

  return (
    <AppShell>
      <ComprasView
        insumos={insumos}
        insumosParaTienda={insumosParaTienda}
        valor={valor}
        porComprar={porComprar}
      />
    </AppShell>
  );
}
