"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";

/** Devuelve el cliente autenticado o lanza si no hay sesión. */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

export async function crearProducto(input: {
  nombre: string;
  precio: number;
  costo: number;
  stock: number;
  categoria?: string;
  unidad?: string;
}): Promise<ActionResult> {
  try {
    const supabase = await requireUser();

    const { data: producto, error } = await supabase
      .from("productos")
      .insert({
        nombre: input.nombre.trim(),
        precio: input.precio,
        costo: input.costo,
        stock: input.stock,
        categoria: input.categoria?.trim() || "General",
        unidad: input.unidad?.trim() || "unidad",
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    // Registrar la producción inicial como movimiento de stock.
    if (input.stock > 0 && producto) {
      await supabase.from("movimientos_stock").insert({
        producto_id: producto.id,
        tipo: "produccion",
        cantidad: input.stock,
        nota: "Stock inicial",
      });
    }

    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function actualizarProducto(
  id: string,
  input: { nombre: string; precio: number; costo: number }
): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    const { error } = await supabase
      .from("productos")
      .update({
        nombre: input.nombre.trim(),
        precio: input.precio,
        costo: input.costo,
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function eliminarProducto(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    // Borrado lógico: conserva el historial de ventas.
    const { error } = await supabase
      .from("productos")
      .update({ activo: false })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Registra una venta rápida de 1 unidad: descuenta stock, crea la venta y el movimiento. */
export async function venderProducto(
  id: string
): Promise<ActionResult<{ stock: number }>> {
  try {
    const supabase = await requireUser();

    const { data: producto, error: fetchError } = await supabase
      .from("productos")
      .select("id, nombre, precio, costo, stock")
      .eq("id", id)
      .single();

    if (fetchError || !producto) {
      return { ok: false, error: fetchError?.message ?? "Producto no encontrado" };
    }
    if (producto.stock <= 0) {
      return { ok: false, error: "Sin stock disponible" };
    }

    const nuevoStock = producto.stock - 1;

    const { error: updateError } = await supabase
      .from("productos")
      .update({ stock: nuevoStock })
      .eq("id", id);
    if (updateError) return { ok: false, error: updateError.message };

    const { error: ventaError } = await supabase.from("ventas").insert({
      producto_id: producto.id,
      nombre_producto: producto.nombre,
      cantidad: 1,
      total: producto.precio,
      costo_total: producto.costo,
    });
    if (ventaError) return { ok: false, error: ventaError.message };

    // Movimiento de salida (negativo) para trazabilidad.
    await supabase.from("movimientos_stock").insert({
      producto_id: producto.id,
      tipo: "venta",
      cantidad: -1,
      nota: "Venta rápida",
    });

    revalidatePath("/");
    revalidatePath("/ventas");
    return { ok: true, data: { stock: nuevoStock } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
