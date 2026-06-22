import { createClient } from "@/lib/supabase/server";

export type Aviso = {
  tipo: "entrega" | "cobro" | "stock" | "produccion";
  titulo: string;
  detalle: string;
  href: string;
  urgente: boolean;
};

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Calcula los avisos del día derivados de los datos, respetando las preferencias
 * de la tabla `ajustes` (tipos activos + días de anticipación).
 */
export async function getAvisos(): Promise<Aviso[]> {
  const supabase = await createClient();

  const { data: cfg } = await supabase
    .from("ajustes")
    .select("*")
    .eq("id", 1)
    .single();

  const a = {
    avisar_entregas: cfg?.avisar_entregas ?? true,
    avisar_cobros: cfg?.avisar_cobros ?? true,
    avisar_stock: cfg?.avisar_stock ?? true,
    avisar_produccion: cfg?.avisar_produccion ?? true,
    dias: cfg?.dias_anticipacion ?? 1,
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(hoy);
  limite.setDate(hoy.getDate() + a.dias);
  const hoyStr = ymd(hoy);
  const limiteStr = ymd(limite);

  const [pedidosRes, prodRes, productosRes] = await Promise.all([
    supabase
      .from("pedidos")
      .select("id, estado, fecha_entrega, fecha_estimada_pago, total, clientes(nombre)")
      .in("estado", ["pendiente", "por_cobrar"]),
    supabase
      .from("producciones")
      .select("id, cantidad, fecha_plan, productos(nombre)")
      .eq("estado", "planificada"),
    supabase
      .from("productos")
      .select("nombre, stock, stock_minimo")
      .eq("activo", true)
      .eq("tipo", "simple"),
  ]);

  const avisos: Aviso[] = [];

  for (const p of pedidosRes.data ?? []) {
    const cliente = (p.clientes as { nombre: string } | null)?.nombre ?? "Sin cliente";
    if (
      a.avisar_entregas &&
      p.estado === "pendiente" &&
      p.fecha_entrega &&
      p.fecha_entrega <= limiteStr
    ) {
      avisos.push({
        tipo: "entrega",
        titulo: `Entregar a ${cliente}`,
        detalle:
          p.fecha_entrega < hoyStr
            ? "Entrega atrasada"
            : p.fecha_entrega === hoyStr
              ? "Entrega hoy"
              : "Entrega próxima",
        href: "/pedidos",
        urgente: p.fecha_entrega <= hoyStr,
      });
    }
    if (
      a.avisar_cobros &&
      p.estado === "por_cobrar" &&
      p.fecha_estimada_pago &&
      p.fecha_estimada_pago <= limiteStr
    ) {
      avisos.push({
        tipo: "cobro",
        titulo: `Cobrar a ${cliente}`,
        detalle:
          p.fecha_estimada_pago < hoyStr
            ? `Vencido · $${p.total.toLocaleString("es-CL")}`
            : `$${p.total.toLocaleString("es-CL")}`,
        href: "/por-cobrar",
        urgente: p.fecha_estimada_pago < hoyStr,
      });
    }
  }

  if (a.avisar_produccion) {
    for (const pr of prodRes.data ?? []) {
      if (pr.fecha_plan && pr.fecha_plan <= limiteStr) {
        const nombre = (pr.productos as { nombre: string } | null)?.nombre ?? "Producto";
        avisos.push({
          tipo: "produccion",
          titulo: `Producir ${nombre}`,
          detalle: `${pr.cantidad} u · ${pr.fecha_plan === hoyStr ? "hoy" : "agendada"}`,
          href: "/calendario",
          urgente: pr.fecha_plan <= hoyStr,
        });
      }
    }
  }

  if (a.avisar_stock) {
    for (const p of productosRes.data ?? []) {
      if (p.stock < p.stock_minimo) {
        avisos.push({
          tipo: "stock",
          titulo: `Stock bajo: ${p.nombre}`,
          detalle: `Quedan ${p.stock} (mín. ${p.stock_minimo})`,
          href: "/productos",
          urgente: p.stock <= 0,
        });
      }
    }
  }

  // Urgentes primero.
  return avisos.sort((x, y) => Number(y.urgente) - Number(x.urgente));
}
