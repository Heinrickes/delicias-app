import { createClient } from "@/lib/supabase/server";

export type ComponentePack = {
  producto_id: string;
  nombre: string;
  cantidad: number;
};

export type ProductoEnriquecido = {
  id: string;
  nombre: string;
  precio: number;
  costo: number; // efectivo (delicias: suma de componentes)
  stock: number; // efectivo (delicias: cajas armables)
  stock_minimo: number;
  categoria: string | null;
  categoria_id: string | null;
  tipo: "simple" | "delicia";
  componentes: ComponentePack[];
};

/**
 * Trae los productos activos con datos efectivos:
 * para las delicias calcula costo, stock disponible y composición desde sus componentes.
 */
export async function getProductosEnriquecidos(): Promise<ProductoEnriquecido[]> {
  const supabase = await createClient();

  const { data: productos } = await supabase
    .from("productos")
    .select(
      "id, nombre, precio, costo, stock, stock_minimo, categoria, categoria_id, tipo"
    )
    .eq("activo", true)
    .order("nombre");

  const lista = productos ?? [];
  const deliciaIds = lista.filter((p) => p.tipo === "delicia").map((p) => p.id);

  const itemsPorDelicia = new Map<
    string,
    {
      producto_id: string;
      cantidad: number;
      nombre: string;
      costo: number;
      stock: number;
    }[]
  >();

  if (deliciaIds.length > 0) {
    const { data: items } = await supabase
      .from("pack_items")
      .select(
        "pack_id, producto_id, cantidad, productos!pack_items_producto_id_fkey(nombre, costo, stock)"
      )
      .in("pack_id", deliciaIds);

    for (const it of items ?? []) {
      const base = it.productos as {
        nombre: string;
        costo: number;
        stock: number;
      } | null;
      const arr = itemsPorDelicia.get(it.pack_id) ?? [];
      arr.push({
        producto_id: it.producto_id,
        cantidad: it.cantidad,
        nombre: base?.nombre ?? "—",
        costo: base?.costo ?? 0,
        stock: base?.stock ?? 0,
      });
      itemsPorDelicia.set(it.pack_id, arr);
    }
  }

  return lista.map((p): ProductoEnriquecido => {
    if (p.tipo === "delicia") {
      const comps = itemsPorDelicia.get(p.id) ?? [];
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
        categoria_id: p.categoria_id,
        tipo: "delicia",
        componentes: comps.map((c) => ({
          producto_id: c.producto_id,
          nombre: c.nombre,
          cantidad: c.cantidad,
        })),
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
      categoria_id: p.categoria_id,
      tipo: "simple",
      componentes: [],
    };
  });
}
