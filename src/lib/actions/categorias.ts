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

export async function crearCategoria(
  nombre: string
): Promise<ActionResult<{ id: string; nombre: string }>> {
  try {
    const n = nombre.trim();
    if (!n) return { ok: false, error: "El nombre es obligatorio" };
    const supabase = await requireUser();
    const { data, error } = await supabase
      .from("categorias")
      .insert({ nombre: n })
      .select("id, nombre")
      .single();
    if (error || !data) {
      const msg = error?.code === "23505" ? "Ya existe esa categoría" : error?.message;
      return { ok: false, error: msg ?? "Error" };
    }
    revalidatePath("/productos");
    return { ok: true, data: { id: data.id, nombre: data.nombre } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function renombrarCategoria(
  id: string,
  nombre: string
): Promise<ActionResult> {
  try {
    const n = nombre.trim();
    if (!n) return { ok: false, error: "El nombre es obligatorio" };
    const supabase = await requireUser();
    const { error } = await supabase
      .from("categorias")
      .update({ nombre: n })
      .eq("id", id);
    if (error) {
      const msg = error.code === "23505" ? "Ya existe esa categoría" : error.message;
      return { ok: false, error: msg };
    }
    // Mantener el texto denormalizado de los productos en sincronía.
    await supabase.from("productos").update({ categoria: n }).eq("categoria_id", id);
    revalidatePath("/productos");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function eliminarCategoria(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    // Limpiar el texto; el categoria_id se vuelve null por la FK (ON DELETE SET NULL).
    await supabase.from("productos").update({ categoria: null }).eq("categoria_id", id);
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/productos");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
