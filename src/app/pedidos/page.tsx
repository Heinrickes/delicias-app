import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { PedidoCard } from "@/components/shared/PedidoCard";
import { PedidoFormDialog } from "@/components/shared/PedidoFormDialog";
import { ActionButton } from "@/components/shared/ActionButton";
import { HistorialTimeline } from "@/components/shared/HistorialTimeline";
import { agruparPorPeriodo, inicialesDe } from "@/lib/historial";
import { obtenerMapaPerfiles } from "@/lib/actions/perfiles";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_PEDIDO, formatMoneda, LOCALE, type EstadoPedido } from "@/lib/constants";
import { ClipboardList } from "lucide-react";

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
  creado_por: string | null;
};

const ACTIVOS = ["pendiente", "por_cobrar"];

async function getData() {
  const supabase = await createClient();

  const [pedidosRes, clientesRes, productosRes, perfiles] = await Promise.all([
    supabase
      .from("pedidos")
      .select(
        "id, fecha_entrega, fecha_estimada_pago, estado, total, notas, clientes(nombre), pedido_items(nombre_producto, cantidad, subtotal), creado_por"
      )
      .order("fecha_entrega", { ascending: true, nullsFirst: false }),
    supabase.from("clientes").select("id, nombre").order("nombre"),
    supabase
      .from("productos")
      .select("id, nombre, precio")
      .eq("activo", true)
      .order("nombre"),
    obtenerMapaPerfiles(),
  ]);

  return {
    pedidos: (pedidosRes.data ?? []) as PedidoRow[],
    clientes: clientesRes.data ?? [],
    productos: productosRes.data ?? [],
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

export default async function PedidosPage() {
  const { pedidos, clientes, productos, perfiles } = await getData();

  const activos = pedidos.filter((p) => ACTIVOS.includes(p.estado));
  const historial = pedidos.filter((p) => !ACTIVOS.includes(p.estado));

  const chipsHistorial = agruparPorPeriodo(
    historial
      .filter((p) => p.fecha_entrega !== null)
      .map((p) => ({ ...p, fecha: p.fecha_entrega as string }))
  ).map((b) => ({
    key: b.key,
    label: b.label,
    count: b.items.length,
    amountLabel: formatMoneda(b.items.reduce((s, p) => s + p.total, 0)),
    eventos: b.items.map((p) => ({
      id: p.id,
      descripcion: `${p.clientes?.nombre ?? "Sin cliente"} · ${ESTADOS_PEDIDO[p.estado as EstadoPedido] ?? p.estado}`,
      when: new Date(p.fecha).toLocaleDateString(LOCALE, { day: "2-digit", month: "short" }),
      amount: formatMoneda(p.total),
      amountTone: p.estado === "cancelado" ? ("neutral" as const) : ("pos" as const),
      author: inicialesDe(p.creado_por ? perfiles[p.creado_por] : null),
    })),
  }));

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Gestión
            </p>
            <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
              Pedidos
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Pedidos por fecha de entrega. Al entregar se genera la venta y se
              descuenta el stock; puedes entregar cobrando o dejar el pago
              pendiente. Los totales y conteos están en{" "}
              <Link href="/reportes?tab=ventas" className="text-primary hover:underline">
                Estadísticas
              </Link>
              .
            </p>
          </div>
          <div className="flex justify-end">
            <PedidoFormDialog
              clientes={clientes}
              productos={productos}
              trigger={
                <ActionButton icon={<ClipboardList className="h-6 w-6" />} label="Nuevo pedido" color="primary" />
              }
            />
          </div>
        </header>

        <section>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Activos ({activos.length})
          </h3>
          {activos.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-12 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                No hay pedidos activos
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Crea un pedido con el botón &quot;Nuevo pedido&quot;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {activos.map((p) => (
                <PedidoCard key={p.id} pedido={toCardProps(p)} />
              ))}
            </div>
          )}
        </section>

        {chipsHistorial.length > 0 && (
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Historial ({historial.length})
            </h3>
            <HistorialTimeline chips={chipsHistorial} />
          </section>
        )}
      </div>
    </AppShell>
  );
}
