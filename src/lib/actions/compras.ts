"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function completarCompra(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("compras_planificadas")
    .update({ estado: "realizada" })
    .eq("id", id);
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
