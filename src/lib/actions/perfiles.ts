"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

/**
 * Crea una cuenta nueva (auth + perfil) — solo admin. No existe registro
 * público: esta es la única forma de dar de alta un usuario.
 */
export async function crearUsuario(input: {
  email: string;
  password: string;
  nombre: string;
  rol: Rol;
}): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();

    if (input.password.length < 8) {
      return { ok: false, error: "La contraseña debe tener al menos 8 caracteres" };
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email: input.email.trim(),
      password: input.password,
      email_confirm: true,
      user_metadata: { nombre: input.nombre.trim() },
    });
    if (error) return { ok: false, error: error.message };
    if (!data.user) return { ok: false, error: "No se pudo crear el usuario" };

    // El trigger handle_new_user ya crea el perfil con rol "colaborador";
    // si se pidió otro rol, se ajusta acá.
    if (input.rol !== "colaborador") {
      const { error: rolError } = await supabase
        .from("profiles")
        .update({ rol: input.rol })
        .eq("id", data.user.id);
      if (rolError) return { ok: false, error: rolError.message };
    }

    revalidatePath("/ajustes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
