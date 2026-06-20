"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";
import type { EstadoPedido } from "@/lib/constants";
import { aplicarSalidaStock } from "@/lib/ventas-helpers";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return supabase;
}

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

export async function crearPedido(input: PedidoInput): Promise<ActionResult> {
  try {
    if (!input.items.length) {
      return { ok: false, error: "Agrega al menos un producto al pedido" };
    }
    const supabase = await requireUser();

    const total = input.items.reduce(
      (s, i) => s + i.precio_unitario * i.cantidad,
      0
    );

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .insert({
        cliente_id: input.cliente_id,
        fecha_entrega: input.fecha_entrega,
        estado: "pendiente",
        total,
        notas: input.notas?.trim() || null,
      })
      .select("id")
      .single();
    if (error || !pedido) return { ok: false, error: error?.message ?? "Error" };

    const items = input.items.map((i) => ({
      pedido_id: pedido.id,
      producto_id: i.producto_id,
      nombre_producto: i.nombre_producto,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
      subtotal: i.precio_unitario * i.cantidad,
    }));

    const { error: itemsErr } = await supabase.from("pedido_items").insert(items);
    if (itemsErr) return { ok: false, error: itemsErr.message };

    revalidatePath("/pedidos");
    revalidatePath("/clientes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

// Estados que implican que el pedido ya fue entregado físicamente.
const ESTADOS_ENTREGADOS = ["entregado", "por_cobrar"];

export async function cambiarEstadoPedido(
  id: string,
  estado: EstadoPedido,
  fechaEstimadaPago?: string | null
): Promise<ActionResult> {
  try {
    const supabase = await requireUser();

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select("id, estado, cliente_id")
      .eq("id", id)
      .single();
    if (error || !pedido) {
      return { ok: false, error: error?.message ?? "Pedido no encontrado" };
    }

    // Al entregar por primera vez (pagado o por cobrar): genera ventas y descuenta stock.
    const seraEntregado = ESTADOS_ENTREGADOS.includes(estado);
    const eraEntregado = ESTADOS_ENTREGADOS.includes(pedido.estado);
    if (seraEntregado && !eraEntregado) {
      const { data: items } = await supabase
        .from("pedido_items")
        .select("producto_id, nombre_producto, cantidad, precio_unitario")
        .eq("pedido_id", id);

      for (const item of items ?? []) {
        let costoTotal = 0;
        if (item.producto_id) {
          // Descuenta stock (componentes del base si es pack) y devuelve el costo.
          costoTotal = await aplicarSalidaStock(
            supabase,
            item.producto_id,
            item.cantidad,
            "Entrega de pedido"
          );
        }

        await supabase.from("ventas").insert({
          producto_id: item.producto_id,
          nombre_producto: item.nombre_producto,
          cantidad: item.cantidad,
          total: item.precio_unitario * item.cantidad,
          costo_total: costoTotal,
          cliente_id: pedido.cliente_id,
          pedido_id: id,
        });
      }

      revalidatePath("/");
      revalidatePath("/ventas");
      revalidatePath("/stock");
    }

    const cambios: { estado: EstadoPedido; fecha_estimada_pago?: string | null } = {
      estado,
    };
    if (estado === "por_cobrar") {
      cambios.fecha_estimada_pago = fechaEstimadaPago ?? null;
    }

    const { error: updErr } = await supabase
      .from("pedidos")
      .update(cambios)
      .eq("id", id);
    if (updErr) return { ok: false, error: updErr.message };

    revalidatePath("/por-cobrar");

    revalidatePath("/pedidos");
    revalidatePath("/clientes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function eliminarPedido(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireUser();
    // Los pedido_items se borran en cascada.
    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/pedidos");
    revalidatePath("/clientes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}
