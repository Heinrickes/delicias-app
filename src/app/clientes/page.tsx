import { AppShell } from "@/components/shared/AppShell";
import { ClienteCard } from "@/components/shared/ClienteCard";
import { ClienteFormDialog } from "@/components/shared/ClienteFormDialog";
import { createClient } from "@/lib/supabase/server";
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

  const [clientesRes, pedidosRes, ventasRes] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre, telefono, email, direccion, notas")
      .order("nombre"),
    supabase.from("pedidos").select("cliente_id"),
    supabase.from("ventas").select("cliente_id, total"),
  ]);

  const pedidosPorCliente = new Map<string, number>();
  for (const p of pedidosRes.data ?? []) {
    if (p.cliente_id)
      pedidosPorCliente.set(
        p.cliente_id,
        (pedidosPorCliente.get(p.cliente_id) ?? 0) + 1
      );
  }

  const ventasPorCliente = new Map<string, number>();
  for (const v of ventasRes.data ?? []) {
    if (v.cliente_id)
      ventasPorCliente.set(
        v.cliente_id,
        (ventasPorCliente.get(v.cliente_id) ?? 0) + v.total
      );
  }

  return {
    clientes: (clientesRes.data ?? []) as Cliente[],
    pedidosPorCliente,
    ventasPorCliente,
  };
}

export default async function ClientesPage() {
  const { clientes, pedidosPorCliente, ventasPorCliente } = await getData();

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
                <button type="button" className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-primary/10">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    <UserPlus className="h-6 w-6" />
                  </span>
                  <span className="text-[11px] font-semibold text-primary">Nuevo cliente</span>
                </button>
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
          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
            {clientes.map((cliente) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                pedidos={pedidosPorCliente.get(cliente.id) ?? 0}
                totalVentas={ventasPorCliente.get(cliente.id) ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
