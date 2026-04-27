import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Receipt, Calendar } from "lucide-react";

export const revalidate = 0;

async function getVentas() {
  const { data: ventas, error } = await supabase
    .from("ventas")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) console.error("Error trayendo ventas:", error);
  return ventas || [];
}

export default async function VentasPage() {
  const ventas = await getVentas();
  const totalIngresos = ventas.reduce((suma, venta) => suma + venta.total, 0);
  const totalVentas = ventas.reduce((suma, venta) => suma + venta.cantidad, 0);

  // Group sales by date
  const today = new Date().toDateString();
  const ventasHoy = ventas.filter(
    (v) => new Date(v.fecha).toDateString() === today
  );
  const ingresoHoy = ventasHoy.reduce((suma, venta) => suma + venta.total, 0);

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-12">
          <Link
            href="/"
            className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Volver al inventario
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Historial de Ventas
          </h1>
          <p className="mt-1 text-sm text-muted">
            Registro completo de todas las transacciones
          </p>
        </header>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Total Recaudado
              </p>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              ${totalIngresos.toLocaleString("es-CL")}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-accent" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Unidades Vendidas
              </p>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {totalVentas}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Ventas Hoy
              </p>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {ventasHoy.length}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Ingreso Hoy
              </p>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              ${ingresoHoy.toLocaleString("es-CL")}
            </p>
          </div>
        </div>

        {/* Sales Table */}
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
            Transacciones ({ventas.length})
          </h2>

          {ventas.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-12 text-center">
              <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted">
                No hay ventas registradas
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Las ventas apareceran aqui cuando registres tu primera
                transaccion
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b bg-background/50">
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted">
                        Fecha
                      </th>
                      <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted">
                        Producto
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted">
                        Cant.
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ventas.map((venta) => (
                      <tr
                        key={venta.id}
                        className="transition-colors hover:bg-background/30"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm tabular-nums text-muted">
                          {new Date(venta.fecha).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-foreground">
                          {venta.nombre_producto}
                        </td>
                        <td className="px-5 py-4 text-center text-sm tabular-nums text-muted">
                          {venta.cantidad}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-medium tabular-nums text-success">
                          ${venta.total.toLocaleString("es-CL")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
