import { AppShell } from "@/components/shared/AppShell";
import { CostosManager, InsumoFormDialog } from "@/components/shared/CostosManager";
import { ActionButton } from "@/components/shared/ActionButton";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";

export const revalidate = 0;

async function getData() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("insumos")
    .select(
      "id, nombre, unidad, stock, stock_minimo, costo_unitario, proveedor, en_lista, imagen_url"
    )
    .eq("activo", true)
    .order("nombre");
  return data ?? [];
}

export default async function InsumosPage() {
  const insumos = await getData();
  const unidadesExistentes = Array.from(
    new Set(insumos.map((i) => i.unidad).filter(Boolean))
  ).sort();

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Despensa
            </p>
            <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
              Insumos
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Tu catálogo de insumos: precios, proveedores y stock. Compras usa
              este catálogo para armar tus listas de compra.
            </p>
          </div>
          <div className="flex justify-end gap-1">
            <InsumoFormDialog
              unidadesExistentes={unidadesExistentes}
              trigger={
                <ActionButton
                  icon={<Plus className="h-6 w-6" />}
                  label="Nuevo insumo"
                  color="primary"
                />
              }
            />
          </div>
        </header>

        <CostosManager insumos={insumos} />
      </div>
    </AppShell>
  );
}
