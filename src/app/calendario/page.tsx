import { AppShell } from "@/components/shared/AppShell";
import { Calendario, type EventoCalendario } from "@/components/shared/Calendario";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

async function getData() {
  const supabase = await createClient();
  const [pedidosRes, produccionesRes, productosRes, comprasRes] = await Promise.all([
    supabase
      .from("pedidos")
      .select(
        "id, estado, fecha_entrega, fecha_estimada_pago, total, clientes(nombre)"
      )
      .in("estado", ["pendiente", "por_cobrar", "entregado"]),
    supabase
      .from("producciones")
      .select("id, cantidad, fecha_plan, estado, productos(nombre)")
      .in("estado", ["planificada", "completada"]),
    supabase
      .from("productos")
      .select("id, nombre")
      .eq("activo", true)
      .eq("tipo", "simple")
      .order("nombre"),
    supabase
      .from("compras")
      .select("id, nombre, fecha_planificada, items, total, proveedor, estado")
      .eq("estado", "planificado")
      .order("fecha_planificada"),
  ]);

  const eventos: EventoCalendario[] = [];

  for (const p of pedidosRes.data ?? []) {
    const cliente = (p.clientes as { nombre: string } | null)?.nombre ?? "Sin cliente";
    if (p.estado === "pendiente" && p.fecha_entrega) {
      eventos.push({
        tipo: "entrega",
        fecha: p.fecha_entrega.slice(0, 10),
        titulo: cliente,
        detalle: `Entregar pedido · $${p.total.toLocaleString("es-CL")}`,
        refId: p.id,
      });
    }
    if (p.estado === "por_cobrar" && p.fecha_estimada_pago) {
      eventos.push({
        tipo: "cobro",
        fecha: p.fecha_estimada_pago.slice(0, 10),
        titulo: cliente,
        detalle: `Cobrar · $${p.total.toLocaleString("es-CL")}`,
        refId: p.id,
      });
    }
    if (p.estado === "entregado" && p.fecha_entrega) {
      eventos.push({
        tipo: "entrega",
        fecha: p.fecha_entrega.slice(0, 10),
        titulo: cliente,
        detalle: `Pedido entregado · $${p.total.toLocaleString("es-CL")}`,
        refId: p.id,
        completado: true,
      });
    }
  }

  for (const pr of produccionesRes.data ?? []) {
    const nombre = (pr.productos as { nombre: string } | null)?.nombre ?? "Producto";
    eventos.push({
      tipo: "produccion",
      fecha: pr.fecha_plan.slice(0, 10),
      titulo: nombre,
      detalle: pr.estado === "completada"
        ? `Producción completada · ${pr.cantidad} u`
        : `Producir ${pr.cantidad} u`,
      refId: pr.id,
      completado: pr.estado === "completada",
    });
  }

  for (const c of comprasRes.data ?? []) {
    if (!c.fecha_planificada) continue;
    const items = (c.items ?? []) as { nombre: string }[];
    const titulo = c.nombre || "Compra de insumos";
    const detalle = [
      c.proveedor ? `${c.proveedor}` : null,
      c.total > 0 ? `$${c.total.toLocaleString("es-CL")}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Compra planificada";
    eventos.push({
      tipo: "compra",
      fecha: c.fecha_planificada.slice(0, 10),
      titulo,
      detalle,
      refId: c.id,
      completado: false,
    });
  }

  return { eventos, productos: productosRes.data ?? [] };
}

export default async function CalendarioPage() {
  const { eventos, productos } = await getData();

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Planificación
          </p>
          <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
            Calendario
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Entregas, cobros, producciones y compras planificadas. Toca un día
            para ver el detalle.
          </p>
        </header>

        <Calendario eventos={eventos} productos={productos} />
      </div>
    </AppShell>
  );
}
