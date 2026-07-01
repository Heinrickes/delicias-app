import { AppShell } from "@/components/shared/AppShell";
import { createClient } from "@/lib/supabase/server";
import { ComprasView } from "./ComprasView";

export const revalidate = 0;

export default async function CostosPage() {
  const supabase = await createClient();

  const [insumosRes, listasRes] = await Promise.all([
    supabase
      .from("insumos")
      .select("id, nombre, unidad, stock, stock_minimo, costo_unitario, en_lista, imagen_url")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("compras")
      .select("id, nombre, estado, total, proveedor, notas, fecha_planificada, fecha_completada, items")
      .eq("estado", "planificado")
      .order("creado_en", { ascending: false })
      .limit(30),
  ]);

  const insumosParaTienda = (insumosRes.data ?? []).map((i) => ({
    id: i.id,
    nombre: i.nombre,
    unidad: i.unidad,
    costo_unitario: i.costo_unitario,
    en_lista: i.en_lista,
    stock: i.stock,
    stock_minimo: i.stock_minimo,
    imagen_url: i.imagen_url ?? null,
  }));

  const listas = (listasRes.data ?? []) as {
    id: string;
    nombre: string | null;
    estado: string;
    total: number;
    proveedor: string | null;
    notas: string | null;
    fecha_planificada: string | null;
    fecha_completada: string | null;
    items: { insumo_id: string; nombre: string; cantidad: number; precio_unitario: number }[];
  }[];

  return (
    <AppShell>
      <ComprasView insumosParaTienda={insumosParaTienda} listas={listas} />
    </AppShell>
  );
}
