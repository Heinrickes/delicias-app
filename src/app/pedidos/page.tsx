import { AppShell } from "@/components/shared/AppShell";
import { PedidoCard } from "@/components/shared/PedidoCard";
import { PedidoFormDialog } from "@/components/shared/PedidoFormDialog";
import { createClient } from "@/lib/supabase/server";
import { formatMoneda } from "@/lib/constants";
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
};

const ACTIVOS = ["pendiente", "por_cobrar"];

async function getData() {
  const supabase = await createClient();

  const [pedidosRes, clientesRes, productosRes] = await Promise.all([
    supabase
      .from("pedidos")
      .select(
        "id, fecha_entrega, fecha_estimada_pago, estado, total, notas, clientes(nombre), pedido_items(nombre_producto, cantidad, subtotal)"
      )
      .order("fecha_entrega", { ascending: true, nullsFirst: false }),
    supabase.from("clientes").select("id, nombre").order("nombre"),
    supabase
      .from("productos")
      .select("id, nombre, precio")
      .eq("activo", true)
      .order("nombre"),
  ]);

  return {
    pedidos: (pedidosRes.data ?? []) as PedidoRow[],
    clientes: clientesRes.data ?? [],
    productos: productosRes.data ?? [],
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
  const { pedidos, clientes, productos } = await getData();

  const activos = pedidos.filter((p) => ACTIVOS.includes(p.estado));
  const historial = pedidos.filter((p) => !ACTIVOS.includes(p.estado));

  const cuenta = (estado: string) =>
    pedidos.filter((p) => p.estado === estado).length;
  const totalPorCobrar = pedidos
    .filter((p) => p.estado === "por_cobrar")
    .reduce((s, p) => s + p.total, 0);

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
              pendiente.
            </p>
          </div>
          <div className="flex justify-end">
            <PedidoFormDialog
              clientes={clientes}
              productos={productos}
              trigger={
                <button type="button" className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-primary/10">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    <ClipboardList className="h-6 w-6" />
                  </span>
                  <span className="text-[11px] font-semibold text-primary">Nuevo pedido</span>
                </button>
              }
            />
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Metric label="Pendientes" value={cuenta("pendiente")} />
          <Metric label="Por cobrar" value={cuenta("por_cobrar")} />
          <Metric label="Total por cobrar" value={formatMoneda(totalPorCobrar)} />
          <Metric label="Pagados" value={cuenta("entregado")} />
        </section>

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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activos.map((p) => (
                <PedidoCard key={p.id} pedido={toCardProps(p)} />
              ))}
            </div>
          )}
        </section>

        {historial.length > 0 && (
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Historial ({historial.length})
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {historial.map((p) => (
                <PedidoCard key={p.id} pedido={toCardProps(p)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}
