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

export type VentaItemInput = {
  producto_id: string | null;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
};

export type CrearVentaInput = {
  cliente_id: string | null;
  fecha_entrega: string | null;
  notas?: string;
  /** Desenlace de la venta: entregada y pagada, entregada por cobrar, o encargo pendiente. */
  estado: Extract<EstadoPedido, "pendiente" | "por_cobrar" | "entregado">;
  fecha_estimada_pago?: string | null;
  items: VentaItemInput[];
};

/**
 * Crea una venta/pedido completo de forma atómica (RPC `crear_venta`).
 * Si el estado es entregado/por_cobrar, descuenta stock y genera las ventas
 * dentro de la misma transacción. Devuelve el id del pedido creado.
 */
export async function crearVenta(
  input: CrearVentaInput
): Promise<ActionResult<{ pedidoId: string }>> {
  try {
    if (!input.items.length) {
      return { ok: false, error: "Agrega al menos un producto" };
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
      p_estado: input.estado,
      p_fecha_pago:
        input.estado === "por_cobrar"
          ? input.fecha_estimada_pago ?? null
          : null,
    } as unknown as CrearVentaArgs;

    const { data, error } = await supabase.rpc("crear_venta", args);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/ventas");
    revalidatePath("/pedidos");
    revalidatePath("/por-cobrar");
    revalidatePath("/stock");
    revalidatePath("/clientes");
    revalidatePath("/");
    return { ok: true, data: { pedidoId: data as string } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
