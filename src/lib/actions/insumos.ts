"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

export type InsumoInput = {
  nombre: string;
  unidad?: string;
  stock?: number;
  stock_minimo?: number;
  costo_unitario?: number;
  proveedor?: string;
};

export async function crearInsumo(input: InsumoInput): Promise<ActionResult> {
  try {
    if (!input.nombre.trim()) return { ok: false, error: "El nombre es obligatorio" };
    const supabase = await requireUser();
    const { error } = await supabase.from("insumos").insert({
      nombre: input.nombre.trim(),
      unidad: input.unidad?.trim() || "unidad",
      stock: input.stock ?? 0,
      stock_minimo: input.stock_minimo ?? 0,
      costo_unitario: input.costo_unitario ?? 0,
      proveedor: input.proveedor?.trim() || null,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/costos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function actualizarInsumo(
  id: string,
  input: InsumoInput
): Promise<ActionResult> {
  try {
    if (!input.nombre.trim()) return { ok: false, error: "El nombre es obligatorio" };
    const supabase = await requireUser();
    const { error } = await supabase
      .from("insumos")
      .update({
        nombre: input.nombre.trim(),
        unidad: input.unidad?.trim() || "unidad",
        stock_minimo: input.stock_minimo ?? 0,
        costo_unitario: input.costo_unitario ?? 0,
        proveedor: input.proveedor?.trim() || null,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/costos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function eliminarInsumo(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    const { error } = await supabase
      .from("insumos")
      .update({ activo: false })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/costos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Ajusta el stock del insumo a un valor exacto. */
export async function ajustarStockInsumo(
  id: string,
  nuevoStock: number
): Promise<ActionResult> {
  try {
    if (!Number.isFinite(nuevoStock) || nuevoStock < 0)
      return { ok: false, error: "Stock inválido" };
    const supabase = await requireUser();
    const { error } = await supabase
      .from("insumos")
      .update({ stock: nuevoStock })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/costos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Marca/desmarca manualmente un insumo en la lista de compras. */
export async function toggleEnLista(
  id: string,
  enLista: boolean
): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    const { error } = await supabase
      .from("insumos")
      .update({ en_lista: enLista })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/costos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
