import Link from "next/link";
import { AppShell } from "@/components/shared/AppShell";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatMoneda, LOCALE } from "@/lib/constants";
import { TrendingUp, Receipt, Coins, Percent } from "lucide-react";

export const revalidate = 0;

type VentaRow = {
  id: string;
  nombre_producto: string;
  cantidad: number;
  total: number;
  costo_total: number;
  fecha: string;
  pedido_id: string | null;
  clientes: { nombre: string } | null;
};

const RANGOS = [
  { key: "hoy", label: "Hoy" },
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "todo", label: "Todo" },
] as const;

type RangoKey = (typeof RANGOS)[number]["key"];

function desdeRango(rango: RangoKey): string | null {
  const d = new Date();
  if (rango === "hoy") {
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (rango === "7d") {
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }
  if (rango === "30d") {
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }
  return null;
}

async function getVentas(rango: RangoKey) {
  const supabase = await createClient();
  let query = supabase
    .from("ventas")
    .select(
      "id, nombre_producto, cantidad, total, costo_total, fecha, pedido_id, clientes(nombre)"
    )
    .order("fecha", { ascending: false });

  const desde = desdeRango(rango);
  if (desde) query = query.gte("fecha", desde);

  const { data, error } = await query;
  if (error) console.error("Error trayendo ventas:", error);
  return (data ?? []) as VentaRow[];
}

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string }>;
}) {
  const { rango: rangoParam } = await searchParams;
  const rango: RangoKey = RANGOS.some((r) => r.key === rangoParam)
    ? (rangoParam as RangoKey)
    : "30d";

  const ventas = await getVentas(rango);

  const ingresos = ventas.reduce((s, v) => s + v.total, 0);
  const costos = ventas.reduce((s, v) => s + v.costo_total, 0);
  const margen = ingresos - costos;
  const margenPct = ingresos > 0 ? Math.round((margen / ingresos) * 100) : 0;
  const unidades = ventas.reduce((s, v) => s + v.cantidad, 0);

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Ventas
          </p>
          <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
            Historial de transacciones
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Ingresos, costos y margen de los movimientos comerciales del taller.
          </p>
        </header>

        {/* Filtros por fecha */}
        <div className="flex flex-wrap gap-2">
          {RANGOS.map((r) => {
            const activo = r.key === rango;
            return (
              <Link
                key={r.key}
                href={`/ventas?rango=${r.key}`}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  activo
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"
                }`}
              >
                {r.label}
              </Link>
            );
          })}
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Ingresos"
            value={formatMoneda(ingresos)}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <Metric
            label="Costos"
            value={formatMoneda(costos)}
            icon={<Coins className="h-4 w-4" />}
          />
          <Metric
            label="Margen"
            value={formatMoneda(margen)}
            helper={`${margenPct}% sobre ingresos`}
            highlight
            icon={<Percent className="h-4 w-4" />}
          />
          <Metric
            label="Unidades vendidas"
            value={unidades.toString()}
            icon={<Receipt className="h-4 w-4" />}
          />
        </section>

        <section>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Transacciones ({ventas.length})
          </h3>

          {ventas.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-12 text-center">
              <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                No hay ventas en este rango
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Registra ventas desde el Dashboard o entregando un pedido.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-3 font-semibold">Fecha</th>
                      <th className="px-5 py-3 font-semibold">Producto</th>
                      <th className="px-5 py-3 font-semibold">Cliente</th>
                      <th className="px-5 py-3 text-center font-semibold">Cant.</th>
                      <th className="px-5 py-3 text-right font-semibold">Total</th>
                      <th className="px-5 py-3 text-right font-semibold">Margen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ventas.map((v) => {
                      const m = v.total - v.costo_total;
                      return (
                        <tr key={v.id} className="hover:bg-background/30">
                          <td className="whitespace-nowrap px-5 py-3 tabular-nums text-muted-foreground">
                            {new Date(v.fecha).toLocaleDateString(LOCALE, {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-5 py-3 font-medium text-foreground">
                            <span className="flex items-center gap-2">
                              {v.nombre_producto}
                              {v.pedido_id && (
                                <Badge className="bg-primary/10 text-primary">
                                  Pedido
                                </Badge>
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {v.clientes?.nombre ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-center tabular-nums text-muted-foreground">
                            {v.cantidad}
                          </td>
                          <td className="px-5 py-3 text-right font-medium tabular-nums text-foreground">
                            {formatMoneda(v.total)}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-success">
                            {formatMoneda(m)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  helper,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  helper?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-md ${
            highlight ? "bg-success/15 text-success" : "bg-background text-gold"
          }`}
        >
          {icon}
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {helper && <p className="mt-1 text-xs text-success">{helper}</p>}
    </div>
  );
}
