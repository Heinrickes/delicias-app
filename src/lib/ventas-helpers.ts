import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type DB = SupabaseClient<Database>;

/**
 * Unidades disponibles de un producto:
 * - simple: su propio stock.
 * - pack: cuántos packs se pueden armar = min(floor(stock_base / cantidad)) por componente.
 */
export async function disponibilidad(
  supabase: DB,
  productoId: string
): Promise<number> {
  const { data: prod } = await supabase
    .from("productos")
    .select("tipo, stock")
    .eq("id", productoId)
    .single();
  if (!prod) return 0;
  if (prod.tipo !== "pack") return prod.stock;

  const { data: items } = await supabase
    .from("pack_items")
    .select("cantidad, productos!pack_items_producto_id_fkey(stock)")
    .eq("pack_id", productoId);
  if (!items || items.length === 0) return 0;

  return Math.min(
    ...items.map((i) => {
      const base = i.productos as { stock: number } | null;
      return Math.floor((base?.stock ?? 0) / i.cantidad);
    })
  );
}

/**
 * Aplica la salida de stock por una venta de `cantidad` unidades del producto.
 * - simple: descuenta `cantidad` de su stock.
 * - pack: descuenta de cada producto base (cantidad_componente * cantidad).
 * Registra el/los movimiento(s) y devuelve el costo total de la operación.
 * Nota: puede dejar el stock negativo (lo controla el llamador si lo necesita).
 */
export async function aplicarSalidaStock(
  supabase: DB,
  productoId: string,
  cantidad: number,
  nota: string
): Promise<number> {
  const { data: prod } = await supabase
    .from("productos")
    .select("tipo, costo, stock")
    .eq("id", productoId)
    .single();
  if (!prod) return 0;

  if (prod.tipo !== "pack") {
    await supabase
      .from("productos")
      .update({ stock: prod.stock - cantidad })
      .eq("id", productoId);
    await supabase.from("movimientos_stock").insert({
      producto_id: productoId,
      tipo: "venta",
      cantidad: -cantidad,
      nota,
    });
    return prod.costo * cantidad;
  }

  // Pack: descontar cada componente del producto base.
  const { data: items } = await supabase
    .from("pack_items")
    .select("producto_id, cantidad, productos!pack_items_producto_id_fkey(costo, stock)")
    .eq("pack_id", productoId);

  let costoTotal = 0;
  for (const it of items ?? []) {
    const base = it.productos as { costo: number; stock: number } | null;
    const unidades = it.cantidad * cantidad;
    costoTotal += (base?.costo ?? 0) * unidades;
    await supabase
      .from("productos")
      .update({ stock: (base?.stock ?? 0) - unidades })
      .eq("id", it.producto_id);
    await supabase.from("movimientos_stock").insert({
      producto_id: it.producto_id,
      tipo: "venta",
      cantidad: -unidades,
      nota,
    });
  }
  return costoTotal;
}
