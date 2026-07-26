import { AppShell } from "@/components/shared/AppShell";
import { ClienteFormDialog } from "@/components/shared/ClienteFormDialog";
import { ClientesListado } from "@/components/shared/ClientesListado";
import { ActionButton } from "@/components/shared/ActionButton";
import { createClient } from "@/lib/supabase/server";
import { obtenerMapaPerfiles } from "@/lib/actions/perfiles";
import { UserPlus, Users } from "lucide-react";

export const revalidate = 0;

type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
};

async function getData() {
  const supabase = await createClient();

  const [clientesRes, pedidosRes, ventasRes, perfiles] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre, telefono, email, direccion, notas")
      .order("nombre"),
    supabase.from("pedidos").select("cliente_id"),
    supabase
      .from("ventas")
      .select("cliente_id, total, nombre_producto, cantidad, fecha, creado_por, modo_pago")
      .order("fecha", { ascending: false }),
    obtenerMapaPerfiles(),
  ]);

  const pedidosPorCliente: Record<string, number> = {};
  for (const p of pedidosRes.data ?? []) {
    if (p.cliente_id)
      pedidosPorCliente[p.cliente_id] = (pedidosPorCliente[p.cliente_id] ?? 0) + 1;
  }

  const ventasPorCliente: Record<string, number> = {};
  const historialPorCliente: Record<
    string,
    {
      fecha: string;
      total: number;
      nombre_producto: string;
      cantidad: number;
      creado_por: string | null;
      modo_pago: string | null;
    }[]
  > = {};
  for (const v of ventasRes.data ?? []) {
    if (!v.cliente_id) continue;
    ventasPorCliente[v.cliente_id] = (ventasPorCliente[v.cliente_id] ?? 0) + v.total;
    (historialPorCliente[v.cliente_id] ??= []).push({
      fecha: v.fecha,
      total: v.total,
      nombre_producto: v.nombre_producto,
      cantidad: v.cantidad,
      creado_por: v.creado_por,
      modo_pago: v.modo_pago,
    });
  }

  return {
    clientes: (clientesRes.data ?? []) as Cliente[],
    pedidosPorCliente,
    ventasPorCliente,
    historialPorCliente,
    perfiles,
  };
}

export default async function ClientesPage() {
  const { clientes, pedidosPorCliente, ventasPorCliente, historialPorCliente, perfiles } =
    await getData();

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Directorio
            </p>
            <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
              Clientes
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Tus clientes recurrentes, sus datos de contacto y su historial.
            </p>
          </div>
          <div className="flex justify-end">
            <ClienteFormDialog
              trigger={
                <ActionButton icon={<UserPlus className="h-6 w-6" />} label="Nuevo cliente" color="primary" />
              }
            />
          </div>
        </header>

        {clientes.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Aún no tienes clientes registrados
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Agrega tu primer cliente con el botón &quot;Nuevo cliente&quot;.
            </p>
          </div>
        ) : (
          <ClientesListado
            clientes={clientes}
            pedidosPorCliente={pedidosPorCliente}
            ventasPorCliente={ventasPorCliente}
            historialPorCliente={historialPorCliente}
            perfiles={perfiles}
          />
        )}
      </div>
    </AppShell>
  );
}
