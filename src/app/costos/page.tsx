import { AppShell } from "@/components/shared/AppShell";
import { createClient } from "@/lib/supabase/server";
import { obtenerMapaPerfiles } from "@/lib/actions/perfiles";
import { ComprasView } from "./ComprasView";

export const revalidate = 0;

export default async function CostosPage() {
  const supabase = await createClient();

  const [insumosRes, listasRes, completadasRes, perfiles] = await Promise.all([
    supabase
      .from("insumos")
      .select("id, nombre, unidad, stock, stock_minimo, costo_unitario, imagen_url")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("compras")
      .select("id, nombre, estado, total, proveedor, notas, fecha_planificada, fecha_completada, items")
      .eq("estado", "planificado")
      .order("creado_en", { ascending: false })
      .limit(30),
    supabase
      .from("compras")
      .select("id, nombre, total, proveedor, fecha_completada, items, creado_por")
      .eq("estado", "completado")
      .order("fecha_completada", { ascending: false })
      .limit(50),
    obtenerMapaPerfiles(),
  ]);

  const insumosParaTienda = (insumosRes.data ?? []).map((i) => ({
    id: i.id,
    nombre: i.nombre,
    unidad: i.unidad,
    costo_unitario: i.costo_unitario,
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

  const completadas = (completadasRes.data ?? []) as {
    id: string;
    nombre: string | null;
    total: number;
    proveedor: string | null;
    fecha_completada: string | null;
    items: { insumo_id: string; nombre: string; cantidad: number; precio_unitario: number }[];
    creado_por: string | null;
  }[];

  return (
    <AppShell>
      <ComprasView
        insumosParaTienda={insumosParaTienda}
        listas={listas}
        completadas={completadas}
        perfiles={perfiles}
      />
    </AppShell>
  );
}
