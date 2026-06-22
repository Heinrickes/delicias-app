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

export type DeliciaItemInput = { producto_id: string; cantidad: number };

export type DeliciaInput = {
  nombre: string;
  precio: number;
  categoria_id?: string | null;
  items: DeliciaItemInput[];
};

/**
 * Crea una Delicia (caja): un producto `tipo='delicia'` compuesto por varios
 * productos simples. Al venderla se descuenta el stock de cada producto base.
 */
export async function crearDelicia(input: DeliciaInput): Promise<ActionResult> {
  try {
    if (!input.nombre.trim()) {
      return { ok: false, error: "El nombre es obligatorio" };
    }
    const items = input.items.filter((i) => i.producto_id && i.cantidad > 0);
    if (items.length === 0) {
      return { ok: false, error: "Agrega al menos un producto a la delicia" };
    }

    const supabase = await requireUser();

    // Una delicia solo puede componerse de productos simples (no de otras delicias).
    const { data: componentes, error: compErr } = await supabase
      .from("productos")
      .select("id, tipo")
      .in(
        "id",
        items.map((i) => i.producto_id)
      );
    if (compErr) return { ok: false, error: compErr.message };
    if ((componentes ?? []).some((c) => c.tipo === "delicia")) {
      return {
        ok: false,
        error: "Una delicia no puede contener otras delicias, solo productos simples",
      };
    }

    let categoria: string | null = null;
    if (input.categoria_id) {
      const { data: cat } = await supabase
        .from("categorias")
        .select("nombre")
        .eq("id", input.categoria_id)
        .single();
      categoria = cat?.nombre ?? null;
    }

    const { data: delicia, error } = await supabase
      .from("productos")
      .insert({
        nombre: input.nombre.trim(),
        precio: input.precio,
        costo: 0, // el costo se calcula desde sus componentes
        stock: 0, // el stock es derivado de los productos base
        categoria_id: input.categoria_id || null,
        categoria,
        unidad: "caja",
        tipo: "delicia",
      })
      .select("id")
      .single();

    if (error || !delicia) return { ok: false, error: error?.message ?? "Error" };

    const { error: itemsErr } = await supabase.from("pack_items").insert(
      items.map((i) => ({
        pack_id: delicia.id,
        producto_id: i.producto_id,
        cantidad: i.cantidad,
      }))
    );
    if (itemsErr) return { ok: false, error: itemsErr.message };

    revalidatePath("/productos");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
