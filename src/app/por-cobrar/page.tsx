import { AppShell } from "@/components/shared/AppShell";
import { PedidoCard } from "@/components/shared/PedidoCard";
import { createClient } from "@/lib/supabase/server";
import { formatMoneda, LOCALE } from "@/lib/constants";
import { Coins, AlertTriangle, CheckCircle2 } from "lucide-react";

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

async function getData() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pedidos")
    .select(
      "id, fecha_entrega, fecha_estimada_pago, estado, total, notas, clientes(nombre), pedido_items(nombre_producto, cantidad, subtotal)"
    )
    .eq("estado", "por_cobrar")
    .order("fecha_estimada_pago", { ascending: true, nullsFirst: false });
  return (data ?? []) as PedidoRow[];
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
  const pedidos = await getData();

  const total = pedidos.reduce((s, p) => s + p.total, 0);
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  const vencidos = pedidos.filter(
    (p) =>
      p.fecha_estimada_pago !== null &&
      new Date(p.fecha_estimada_pago + "T23:59:59") < hoy
  );
  const totalVencido = vencidos.reduce((s, p) => s + p.total, 0);

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

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Metric
            label="Total por cobrar"
            value={formatMoneda(total)}
            icon={<Coins className="h-4 w-4" />}
          />
          <Metric
            label="Pedidos pendientes"
            value={pedidos.length.toString()}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <Metric
            label="Vencido"
            value={formatMoneda(totalVencido)}
            danger={totalVencido > 0}
            icon={<AlertTriangle className="h-4 w-4" />}
            helper={`${vencidos.length} ${vencidos.length === 1 ? "pedido" : "pedidos"}`}
          />
        </section>

        {pedidos.length === 0 ? (
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pedidos.map((p) => (
              <PedidoCard key={p.id} pedido={toCardProps(p)} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  icon,
  helper,
  danger = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  helper?: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-md ${
            danger ? "bg-danger/10 text-danger" : "bg-background text-gold"
          }`}
        >
          {icon}
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={`mt-3 text-2xl font-semibold tabular-nums ${
          danger ? "text-danger" : "text-foreground"
        }`}
      >
        {value}
      </p>
      {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}
