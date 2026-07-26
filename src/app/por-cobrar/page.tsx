import { AppShell } from "@/components/shared/AppShell";
import { PedidoCard } from "@/components/shared/PedidoCard";
import { HistorialTimeline } from "@/components/shared/HistorialTimeline";
import { agruparPorPeriodo, inicialesDe } from "@/lib/historial";
import { obtenerMapaPerfiles } from "@/lib/actions/perfiles";
import { createClient } from "@/lib/supabase/server";
import { formatMoneda, LOCALE } from "@/lib/constants";
import { CheckCircle2 } from "lucide-react";

export const revalidate = 0;

type PedidoRow = {
  id: string;
  fecha_entrega: string | null;
  fecha_estimada_pago: string | null;
  estado: string;
  total: number;
  notas: string | null;
  clientes: { nombre: string } | null;
  pedido_items: {
    nombre_producto: string;
    cantidad: number;
    subtotal: number;
  }[];
};

type CobroRow = {
  id: string;
  fecha_entrega: string | null;
  total: number;
  clientes: { nombre: string } | null;
  actualizado_por: string | null;
};

async function getData() {
  const supabase = await createClient();
  const [pendientesRes, cobradosRes, perfiles] = await Promise.all([
    supabase
      .from("pedidos")
      .select(
        "id, fecha_entrega, fecha_estimada_pago, estado, total, notas, clientes(nombre), pedido_items(nombre_producto, cantidad, subtotal)"
      )
      .eq("estado", "por_cobrar")
      .order("fecha_estimada_pago", { ascending: true, nullsFirst: false }),
    // Historial: pedidos que pasaron por "por cobrar" y ya se pagaron.
    supabase
      .from("pedidos")
      .select("id, fecha_entrega, total, clientes(nombre), actualizado_por")
      .eq("estado", "entregado")
      .not("fecha_estimada_pago", "is", null)
      .order("fecha_entrega", { ascending: false })
      .limit(50),
    obtenerMapaPerfiles(),
  ]);
  return {
    pendientes: (pendientesRes.data ?? []) as PedidoRow[],
    cobrados: (cobradosRes.data ?? []) as CobroRow[],
    perfiles,
  };
}

function toCardProps(p: PedidoRow) {
  return {
    id: p.id,
    fecha_entrega: p.fecha_entrega,
    fecha_estimada_pago: p.fecha_estimada_pago,
    estado: p.estado,
    total: p.total,
    notas: p.notas,
    cliente: p.clientes?.nombre ?? null,
    items: p.pedido_items,
  };
}

export default async function PorCobrarPage() {
  const { pendientes, cobrados, perfiles } = await getData();

  const chips = agruparPorPeriodo(
    cobrados
      .filter((c) => c.fecha_entrega !== null)
      .map((c) => ({ ...c, fecha: c.fecha_entrega as string }))
  ).map((b) => ({
    key: b.key,
    label: b.label,
    count: b.items.length,
    amountLabel: formatMoneda(b.items.reduce((s, c) => s + c.total, 0)),
    eventos: b.items.map((c) => ({
      id: c.id,
      descripcion: c.clientes?.nombre ?? "Sin cliente",
      when: new Date(c.fecha).toLocaleDateString(LOCALE, { day: "2-digit", month: "short" }),
      amount: formatMoneda(c.total),
      amountTone: "pos" as const,
      author: inicialesDe(c.actualizado_por ? perfiles[c.actualizado_por] : null),
    })),
  }));

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Cobranzas
          </p>
          <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
            Por cobrar
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Pedidos entregados que están pendientes de pago. Marca cada uno como
            pagado cuando recibas el dinero.
          </p>
        </header>

        {pendientes.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <p className="mt-4 text-sm text-muted-foreground">
              No tienes nada por cobrar
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cuando entregues un pedido sin cobrar aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pendientes.map((p) => (
              <PedidoCard key={p.id} pedido={toCardProps(p)} />
            ))}
          </div>
        )}

        {chips.length > 0 && (
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Historial de cobros
            </h3>
            <HistorialTimeline chips={chips} />
          </section>
        )}
      </div>
    </AppShell>
  );
}
