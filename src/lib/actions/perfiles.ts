"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";

export type Rol = "admin" | "dueña" | "colaborador";

export type Perfil = {
  id: string;
  nombre: string;
  rol: Rol;
  email: string | null;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  const { data: perfil } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (perfil?.rol !== "admin") throw new Error("Solo un administrador puede gestionar usuarios");
  return { supabase, userId: user.id };
}

/** Mapa id → nombre de todos los perfiles, para mostrar autor en HistorialTimeline. */
export async function obtenerMapaPerfiles(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, nombre");
  const mapa: Record<string, string> = {};
  for (const p of data ?? []) mapa[p.id] = p.nombre;
  return mapa;
}

/** Perfil del usuario autenticado (para decidir si mostrar la gestión de usuarios). */
export async function obtenerPerfilActual(): Promise<Perfil | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, nombre, rol")
    .eq("id", user.id)
    .single();
  if (!data) return null;
  return { id: data.id, nombre: data.nombre, rol: data.rol as Rol, email: user.email ?? null };
}

/** Lista todos los perfiles (solo admin). */
export async function listarPerfiles(): Promise<ActionResult<Perfil[]>> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nombre, rol")
      .order("creado_en", { ascending: true });
    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      data: (data ?? []).map((p) => ({ id: p.id, nombre: p.nombre, rol: p.rol as Rol, email: null })),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Cambia el rol y/o nombre de un perfil (solo admin). */
export async function actualizarPerfil(
  id: string,
  input: { nombre?: string; rol?: Rol }
): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireAdmin();
    if (input.rol !== undefined && id === userId) {
      return { ok: false, error: "No puedes cambiar tu propio rol" };
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        ...(input.nombre !== undefined && { nombre: input.nombre.trim() }),
        ...(input.rol !== undefined && { rol: input.rol }),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/ajustes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
