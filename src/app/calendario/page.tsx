import { AppShell } from "@/components/shared/AppShell";
import { Calendario, type EventoCalendario } from "@/components/shared/Calendario";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

async function getData() {
  const supabase = await createClient();
  const [pedidosRes, produccionesRes, productosRes] = await Promise.all([
    supabase
      .from("pedidos")
      .select(
        "id, estado, fecha_entrega, fecha_estimada_pago, total, clientes(nombre)"
      )
      .in("estado", ["pendiente", "por_cobrar"]),
    supabase
      .from("producciones")
      .select("id, cantidad, fecha_plan, estado, productos(nombre)")
      .eq("estado", "planificada"),
    supabase
      .from("productos")
      .select("id, nombre")
      .eq("activo", true)
      .eq("tipo", "simple")
      .order("nombre"),
  ]);

  const eventos: EventoCalendario[] = [];

  for (const p of pedidosRes.data ?? []) {
    const cliente = (p.clientes as { nombre: string } | null)?.nombre ?? "Sin cliente";
    if (p.estado === "pendiente" && p.fecha_entrega) {
      eventos.push({
        tipo: "entrega",
        fecha: p.fecha_entrega,
        titulo: cliente,
        detalle: `Entregar pedido · $${p.total.toLocaleString("es-CL")}`,
        refId: p.id,
      });
    }
    if (p.estado === "por_cobrar" && p.fecha_estimada_pago) {
      eventos.push({
        tipo: "cobro",
        fecha: p.fecha_estimada_pago,
        titulo: cliente,
        detalle: `Cobrar · $${p.total.toLocaleString("es-CL")}`,
        refId: p.id,
      });
    }
  }

  for (const pr of produccionesRes.data ?? []) {
    const nombre = (pr.productos as { nombre: string } | null)?.nombre ?? "Producto";
    eventos.push({
      tipo: "produccion",
      fecha: pr.fecha_plan,
      titulo: nombre,
      detalle: `Producir ${pr.cantidad} u`,
      refId: pr.id,
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
            Entregas, cobros y producciones agendadas. Toca un día para ver el
            detalle.
          </p>
        </header>

        <Calendario eventos={eventos} productos={productos} />
      </div>
    </AppShell>
  );
}
