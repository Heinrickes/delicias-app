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

type DB = Awaited<ReturnType<typeof requireUser>>;

/** Resuelve el nombre de una categoría para guardarlo denormalizado. */
async function nombreCategoria(
  supabase: DB,
  categoriaId: string | null | undefined
): Promise<string | null> {
  if (!categoriaId) return null;
  const { data } = await supabase
    .from("categorias")
    .select("nombre")
    .eq("id", categoriaId)
    .single();
  return data?.nombre ?? null;
}

export async function crearProducto(input: {
  nombre: string;
  precio: number;
  costo: number;
  stock: number;
  categoria_id?: string | null;
  unidad?: string;
}): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    const categoria = await nombreCategoria(supabase, input.categoria_id);

    const { data: producto, error } = await supabase
      .from("productos")
      .insert({
        nombre: input.nombre.trim(),
        precio: input.precio,
        costo: input.costo,
        stock: input.stock,
        categoria_id: input.categoria_id || null,
        categoria,
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
  input: {
    nombre: string;
    precio: number;
    costo: number;
    categoria_id?: string | null;
  }
): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    const categoria = await nombreCategoria(supabase, input.categoria_id);
    const { error } = await supabase
      .from("productos")
      .update({
        nombre: input.nombre.trim(),
        precio: input.precio,
        costo: input.costo,
        categoria_id: input.categoria_id || null,
        categoria,
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
