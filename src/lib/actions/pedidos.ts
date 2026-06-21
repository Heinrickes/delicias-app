"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";
import type { Database, Json } from "@/types/database";
import type { EstadoPedido } from "@/lib/constants";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

type CrearVentaArgs = Database["public"]["Functions"]["crear_venta"]["Args"];
type CambiarEstadoArgs =
  Database["public"]["Functions"]["cambiar_estado_pedido"]["Args"];

export type PedidoItemInput = {
  producto_id: string | null;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
};

export type PedidoInput = {
  cliente_id: string | null;
  fecha_entrega: string | null;
  notas?: string;
  items: PedidoItemInput[];
};

/**
 * Crea un encargo en estado pendiente (sin tocar stock). Usa la RPC
 * transaccional `crear_venta` para que pedido + items se inserten atómicamente.
 */
export async function crearPedido(input: PedidoInput): Promise<ActionResult> {
  try {
    if (!input.items.length) {
      return { ok: false, error: "Agrega al menos un producto al pedido" };
    }
    const supabase = await requireUser();

    const args = {
      p_items: input.items.map((i) => ({
        producto_id: i.producto_id,
        nombre_producto: i.nombre_producto,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
      })) as unknown as Json,
      p_cliente_id: input.cliente_id,
      p_fecha_entrega: input.fecha_entrega,
      p_notas: input.notas?.trim() || null,
      p_estado: "pendiente",
      p_fecha_pago: null,
    } as unknown as CrearVentaArgs;

    const { error } = await supabase.rpc("crear_venta", args);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/pedidos");
    revalidatePath("/clientes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/**
 * Cambia el estado de un pedido de forma atómica (RPC `cambiar_estado_pedido`):
 * - primera entrega → descuenta stock y genera ventas;
 * - cancelar un pedido entregado → revierte stock y borra sus ventas.
 */
export async function cambiarEstadoPedido(
  id: string,
  estado: EstadoPedido,
  fechaEstimadaPago?: string | null
): Promise<ActionResult> {
  try {
    const supabase = await requireUser();

    const args = {
      p_id: id,
      p_estado: estado,
      p_fecha_pago: estado === "por_cobrar" ? fechaEstimadaPago ?? null : null,
    } as unknown as CambiarEstadoArgs;

    const { error } = await supabase.rpc("cambiar_estado_pedido", args);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    revalidatePath("/ventas");
    revalidatePath("/stock");
    revalidatePath("/por-cobrar");
    revalidatePath("/pedidos");
    revalidatePath("/clientes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Elimina un pedido; si estaba entregado, revierte stock y ventas (RPC). */
export async function eliminarPedido(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    const { error } = await supabase.rpc("eliminar_pedido", { p_id: id });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    revalidatePath("/ventas");
    revalidatePath("/stock");
    revalidatePath("/por-cobrar");
    revalidatePath("/pedidos");
    revalidatePath("/clientes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
