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

export async function agendarProduccion(input: {
  producto_id: string;
  cantidad: number;
  fecha_plan: string;
  nota?: string;
}): Promise<ActionResult> {
  try {
    if (!input.producto_id) return { ok: false, error: "Elige un producto" };
    if (!Number.isFinite(input.cantidad) || input.cantidad <= 0)
      return { ok: false, error: "Cantidad inválida" };
    if (!input.fecha_plan) return { ok: false, error: "Elige una fecha" };

    const supabase = await requireUser();
    const { error } = await supabase.from("producciones").insert({
      producto_id: input.producto_id,
      cantidad: input.cantidad,
      fecha_plan: input.fecha_plan,
      nota: input.nota?.trim() || null,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/calendario");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Confirma una producción agendada: suma stock y registra el movimiento (RPC atómica). */
export async function confirmarProduccion(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    const { error } = await supabase.rpc("confirmar_produccion", { p_id: id });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/calendario");
    revalidatePath("/stock");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function eliminarProduccion(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    const { error } = await supabase.from("producciones").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/calendario");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
