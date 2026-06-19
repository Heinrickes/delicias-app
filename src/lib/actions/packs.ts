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

export type PackItemInput = { producto_id: string; cantidad: number };

export type PackInput = {
  nombre: string;
  precio: number;
  categoria?: string;
  items: PackItemInput[];
};

export async function crearPack(input: PackInput): Promise<ActionResult> {
  try {
    if (!input.nombre.trim()) {
      return { ok: false, error: "El nombre es obligatorio" };
    }
    const items = input.items.filter((i) => i.producto_id && i.cantidad > 0);
    if (items.length === 0) {
      return { ok: false, error: "Agrega al menos un producto al pack" };
    }

    const supabase = await requireUser();

    const { data: pack, error } = await supabase
      .from("productos")
      .insert({
        nombre: input.nombre.trim(),
        precio: input.precio,
        costo: 0, // el costo del pack se calcula desde sus componentes
        stock: 0, // el stock del pack es derivado del producto base
        categoria: input.categoria?.trim() || "Packs",
        unidad: "pack",
        tipo: "pack",
      })
      .select("id")
      .single();

    if (error || !pack) return { ok: false, error: error?.message ?? "Error" };

    const { error: itemsErr } = await supabase.from("pack_items").insert(
      items.map((i) => ({
        pack_id: pack.id,
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
