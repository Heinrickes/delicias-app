import { createClient } from "@/lib/supabase/server";

export type ComponentePack = { nombre: string; cantidad: number };

export type ProductoEnriquecido = {
  id: string;
  nombre: string;
  precio: number;
  costo: number; // efectivo (packs: suma de componentes)
  stock: number; // efectivo (packs: packs armables)
  stock_minimo: number;
  categoria: string | null;
  tipo: "simple" | "pack";
  componentes: ComponentePack[];
};

/**
 * Trae los productos activos con datos efectivos:
 * para los packs calcula costo, stock disponible y composición desde sus componentes.
 */
export async function getProductosEnriquecidos(): Promise<ProductoEnriquecido[]> {
  const supabase = await createClient();

  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, precio, costo, stock, stock_minimo, categoria, tipo")
    .eq("activo", true)
    .order("nombre");

  const lista = productos ?? [];
  const packIds = lista.filter((p) => p.tipo === "pack").map((p) => p.id);

  const itemsPorPack = new Map<
    string,
    { cantidad: number; nombre: string; costo: number; stock: number }[]
  >();

  if (packIds.length > 0) {
    const { data: items } = await supabase
      .from("pack_items")
      .select(
        "pack_id, cantidad, productos!pack_items_producto_id_fkey(nombre, costo, stock)"
      )
      .in("pack_id", packIds);

    for (const it of items ?? []) {
      const base = it.productos as {
        nombre: string;
        costo: number;
        stock: number;
      } | null;
      const arr = itemsPorPack.get(it.pack_id) ?? [];
      arr.push({
        cantidad: it.cantidad,
        nombre: base?.nombre ?? "—",
        costo: base?.costo ?? 0,
        stock: base?.stock ?? 0,
      });
      itemsPorPack.set(it.pack_id, arr);
    }
  }

  return lista.map((p): ProductoEnriquecido => {
    if (p.tipo === "pack") {
      const comps = itemsPorPack.get(p.id) ?? [];
      const costo = comps.reduce((s, c) => s + c.cantidad * c.costo, 0);
      const stock =
        comps.length > 0
          ? Math.min(...comps.map((c) => Math.floor(c.stock / c.cantidad)))
          : 0;
      return {
        id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        costo,
        stock,
        stock_minimo: p.stock_minimo,
        categoria: p.categoria,
        tipo: "pack",
        componentes: comps.map((c) => ({ nombre: c.nombre, cantidad: c.cantidad })),
      };
    }
    return {
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      costo: p.costo,
      stock: p.stock,
      stock_minimo: p.stock_minimo,
      categoria: p.categoria,
      tipo: "simple",
      componentes: [],
    };
  });
}
