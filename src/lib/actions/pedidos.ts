"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";
import type { EstadoPedido } from "@/lib/constants";

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

export async function cambiarEstadoPedido(
  id: string,
  estado: EstadoPedido
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

    // Al entregar (solo la primera vez): genera ventas y descuenta stock.
    if (estado === "entregado" && pedido.estado !== "entregado") {
      const { data: items } = await supabase
        .from("pedido_items")
        .select("producto_id, nombre_producto, cantidad, precio_unitario")
        .eq("pedido_id", id);

      for (const item of items ?? []) {
        let costoUnit = 0;
        let stockActual: number | null = null;

        if (item.producto_id) {
          const { data: prod } = await supabase
            .from("productos")
            .select("costo, stock")
            .eq("id", item.producto_id)
            .single();
          if (prod) {
            costoUnit = prod.costo;
            stockActual = prod.stock;
          }
        }

        await supabase.from("ventas").insert({
          producto_id: item.producto_id,
          nombre_producto: item.nombre_producto,
          cantidad: item.cantidad,
          total: item.precio_unitario * item.cantidad,
          costo_total: costoUnit * item.cantidad,
          cliente_id: pedido.cliente_id,
          pedido_id: id,
        });

        if (item.producto_id && stockActual !== null) {
          await supabase
            .from("productos")
            .update({ stock: stockActual - item.cantidad })
            .eq("id", item.producto_id);
          await supabase.from("movimientos_stock").insert({
            producto_id: item.producto_id,
            tipo: "venta",
            cantidad: -item.cantidad,
            nota: "Entrega de pedido",
          });
        }
      }

      revalidatePath("/");
      revalidatePath("/ventas");
      revalidatePath("/stock");
    }

    const { error: updErr } = await supabase
      .from("pedidos")
      .update({ estado })
      .eq("id", id);
    if (updErr) return { ok: false, error: updErr.message };

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
