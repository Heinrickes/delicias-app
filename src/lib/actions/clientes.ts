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

export type ClienteInput = {
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
};

function normaliza(input: ClienteInput) {
  return {
    nombre: input.nombre.trim(),
    telefono: input.telefono?.trim() || null,
    email: input.email?.trim() || null,
    direccion: input.direccion?.trim() || null,
    notas: input.notas?.trim() || null,
  };
}

export async function crearCliente(
  input: ClienteInput
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!input.nombre.trim()) return { ok: false, error: "El nombre es obligatorio" };
    const supabase = await requireUser();
    const { data, error } = await supabase
      .from("clientes")
      .insert(normaliza(input))
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "Error" };
    revalidatePath("/clientes");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function actualizarCliente(
  id: string,
  input: ClienteInput
): Promise<ActionResult> {
  try {
    if (!input.nombre.trim()) return { ok: false, error: "El nombre es obligatorio" };
    const supabase = await requireUser();
    const { error } = await supabase
      .from("clientes")
      .update(normaliza(input))
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/clientes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function eliminarCliente(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    // Los pedidos/ventas asociados conservan su historial (FK ON DELETE SET NULL).
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/clientes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
