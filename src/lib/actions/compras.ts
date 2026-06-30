"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";
import { incrementarStockInsumo } from "@/lib/actions/insumos";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

export type CompraItem = {
  insumo_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
};

function revalidarCompras() {
  revalidatePath("/costos");
  revalidatePath("/calendario");
  revalidatePath("/");
}

/** Registra una compra completada: sube el stock de cada insumo de forma inmediata. */
export async function crearCompra(
  items: CompraItem[],
  total: number,
  proveedor?: string,
  notas?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!items.length) return { ok: false, error: "Agrega al menos un insumo" };
    const supabase = await requireUser();

    const hoy = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("compras")
      .insert({
        items,
        total,
        proveedor: proveedor?.trim() || null,
        notas: notas?.trim() || null,
        estado: "completado",
        fecha_completada: hoy,
      })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Error al guardar" };

    // Subir stock de cada insumo
    for (const item of items) {
      const r = await incrementarStockInsumo(item.insumo_id, item.cantidad);
      if (!r.ok) return { ok: false, error: `Error al actualizar stock de ${item.nombre}: ${r.error}` };
    }

    revalidarCompras();
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Guarda una compra planificada sin tocar el stock todavía. */
export async function planificarCompra(
  items: CompraItem[],
  total: number,
  fechaPlanificada: string,
  proveedor?: string,
  notas?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!items.length) return { ok: false, error: "Agrega al menos un insumo" };
    if (!fechaPlanificada) return { ok: false, error: "Selecciona una fecha" };
    const supabase = await requireUser();

    const { data, error } = await supabase
      .from("compras")
      .insert({
        items,
        total,
        proveedor: proveedor?.trim() || null,
        notas: notas?.trim() || null,
        estado: "planificado",
        fecha_planificada: fechaPlanificada,
      })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Error al guardar" };

    revalidarCompras();
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Completa una compra planificada: sube stock y registra la fecha real. */
export async function completarCompra(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireUser();

    const { data, error: fetchErr } = await supabase
      .from("compras")
      .select("items")
      .eq("id", id)
      .single();

    if (fetchErr || !data) return { ok: false, error: "Compra no encontrada" };

    const items = data.items as CompraItem[];
    for (const item of items) {
      const r = await incrementarStockInsumo(item.insumo_id, item.cantidad);
      if (!r.ok) return { ok: false, error: `Error al actualizar stock de ${item.nombre}: ${r.error}` };
    }

    const hoy = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from("compras")
      .update({ estado: "completado", fecha_completada: hoy })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidarCompras();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Cancela una compra planificada (no modifica stock). */
export async function cancelarCompra(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    const { error } = await supabase
      .from("compras")
      .update({ estado: "cancelado" })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidarCompras();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

// ─── Legacy: compras_planificadas (usadas por el Calendario antiguo) ─────────

export async function agendarCompra(data: {
  fecha_plan: string;
  descripcion: string;
  proveedor?: string;
  notas?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("compras_planificadas").insert({
    fecha_plan: data.fecha_plan,
    descripcion: data.descripcion,
    proveedor: data.proveedor || null,
    notas: data.notas || null,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/calendario");
  return { ok: true as const };
}

export async function eliminarCompra(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("compras_planificadas")
    .delete()
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/calendario");
  return { ok: true as const };
}
