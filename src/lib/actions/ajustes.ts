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

export type AjustesInput = {
  avisar_entregas: boolean;
  avisar_cobros: boolean;
  avisar_stock: boolean;
  avisar_produccion: boolean;
  dias_anticipacion: number;
};

export async function actualizarAjustes(
  input: AjustesInput
): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    const { error } = await supabase
      .from("ajustes")
      .update({
        avisar_entregas: input.avisar_entregas,
        avisar_cobros: input.avisar_cobros,
        avisar_stock: input.avisar_stock,
        avisar_produccion: input.avisar_produccion,
        dias_anticipacion: Math.max(0, Math.min(30, input.dias_anticipacion)),
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/ajustes");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Guarda una suscripción Web Push (un dispositivo). */
export async function guardarSuscripcionPush(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, {
        onConflict: "endpoint",
      });
    if (error) return { ok: false, error: error.message };
    await supabase.from("ajustes").update({ push_activado: true }).eq("id", 1);
    revalidatePath("/ajustes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function eliminarSuscripcionPush(
  endpoint: string
): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    revalidatePath("/ajustes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
