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

function revalidateStock() {
  revalidatePath("/stock");
  revalidatePath("/");
}

/** Registra producción de un lote: suma al stock y deja el movimiento. */
export async function registrarProduccion(
  productoId: string,
  cantidad: number,
  nota?: string
): Promise<ActionResult> {
  try {
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return { ok: false, error: "La cantidad debe ser mayor a 0" };
    }
    const supabase = await requireUser();

    const { data: prod, error } = await supabase
      .from("productos")
      .select("stock")
      .eq("id", productoId)
      .single();
    if (error || !prod) {
      return { ok: false, error: error?.message ?? "Producto no encontrado" };
    }

    const { error: updError } = await supabase
      .from("productos")
      .update({ stock: prod.stock + cantidad })
      .eq("id", productoId);
    if (updError) return { ok: false, error: updError.message };

    await supabase.from("movimientos_stock").insert({
      producto_id: productoId,
      tipo: "produccion",
      cantidad,
      nota: nota?.trim() || "Producción",
    });

    revalidateStock();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Registra merma/pérdida: descuenta del stock (sin bajar de 0). */
export async function registrarMerma(
  productoId: string,
  cantidad: number,
  nota?: string
): Promise<ActionResult> {
  try {
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return { ok: false, error: "La cantidad debe ser mayor a 0" };
    }
    const supabase = await requireUser();

    const { data: prod, error } = await supabase
      .from("productos")
      .select("stock")
      .eq("id", productoId)
      .single();
    if (error || !prod) {
      return { ok: false, error: error?.message ?? "Producto no encontrado" };
    }

    const baja = Math.min(cantidad, prod.stock);
    if (baja <= 0) return { ok: false, error: "No hay stock para descontar" };

    const { error: updError } = await supabase
      .from("productos")
      .update({ stock: prod.stock - baja })
      .eq("id", productoId);
    if (updError) return { ok: false, error: updError.message };

    await supabase.from("movimientos_stock").insert({
      producto_id: productoId,
      tipo: "merma",
      cantidad: -baja,
      nota: nota?.trim() || "Merma",
    });

    revalidateStock();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Define el umbral de stock bajo para un producto (no genera movimiento). */
export async function definirStockMinimo(
  productoId: string,
  stockMinimo: number
): Promise<ActionResult> {
  try {
    if (!Number.isFinite(stockMinimo) || stockMinimo < 0) {
      return { ok: false, error: "El umbral no puede ser negativo" };
    }
    const supabase = await requireUser();
    const { error } = await supabase
      .from("productos")
      .update({ stock_minimo: stockMinimo })
      .eq("id", productoId);
    if (error) return { ok: false, error: error.message };
    revalidateStock();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Ajusta el stock a un valor exacto y registra la diferencia. */
export async function ajustarStock(
  productoId: string,
  nuevoStock: number,
  nota?: string
): Promise<ActionResult> {
  try {
    if (!Number.isFinite(nuevoStock) || nuevoStock < 0) {
      return { ok: false, error: "El stock no puede ser negativo" };
    }
    const supabase = await requireUser();

    const { data: prod, error } = await supabase
      .from("productos")
      .select("stock")
      .eq("id", productoId)
      .single();
    if (error || !prod) {
      return { ok: false, error: error?.message ?? "Producto no encontrado" };
    }

    const delta = nuevoStock - prod.stock;
    if (delta === 0) return { ok: true };

    const { error: updError } = await supabase
      .from("productos")
      .update({ stock: nuevoStock })
      .eq("id", productoId);
    if (updError) return { ok: false, error: updError.message };

    await supabase.from("movimientos_stock").insert({
      producto_id: productoId,
      tipo: "ajuste",
      cantidad: delta,
      nota: nota?.trim() || "Ajuste manual",
    });

    revalidateStock();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
