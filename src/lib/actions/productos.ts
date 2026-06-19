"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";
import { aplicarSalidaStock, disponibilidad } from "@/lib/ventas-helpers";

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
    revalidatePath("/productos");
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
    revalidatePath("/productos");
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
    revalidatePath("/productos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Registra una venta rápida de 1 unidad/pack: descuenta stock (base si es pack), crea la venta y el movimiento. */
export async function venderProducto(
  id: string
): Promise<ActionResult<{ stock: number }>> {
  try {
    const supabase = await requireUser();

    const { data: producto, error: fetchError } = await supabase
      .from("productos")
      .select("id, nombre, precio")
      .eq("id", id)
      .single();

    if (fetchError || !producto) {
      return { ok: false, error: fetchError?.message ?? "Producto no encontrado" };
    }

    const disp = await disponibilidad(supabase, id);
    if (disp <= 0) {
      return { ok: false, error: "Sin stock disponible" };
    }

    const costoTotal = await aplicarSalidaStock(supabase, id, 1, "Venta rápida");

    const { error: ventaError } = await supabase.from("ventas").insert({
      producto_id: producto.id,
      nombre_producto: producto.nombre,
      cantidad: 1,
      total: producto.precio,
      costo_total: costoTotal,
    });
    if (ventaError) return { ok: false, error: ventaError.message };

    const nuevoStock = await disponibilidad(supabase, id);

    revalidatePath("/");
    revalidatePath("/productos");
    revalidatePath("/ventas");
    revalidatePath("/stock");
    return { ok: true, data: { stock: nuevoStock } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
