import { AppShell } from "@/components/shared/AppShell";
import { AjustesForm } from "@/components/shared/AjustesForm";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AjustesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("ajustes").select("*").eq("id", 1).single();

  const inicial = {
    avisar_entregas: data?.avisar_entregas ?? true,
    avisar_cobros: data?.avisar_cobros ?? true,
    avisar_stock: data?.avisar_stock ?? true,
    avisar_produccion: data?.avisar_produccion ?? true,
    dias_anticipacion: data?.dias_anticipacion ?? 1,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Configuración
          </p>
          <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
            Ajustes
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Controla qué avisos quieres recibir y con cuánta anticipación.
          </p>
        </header>

        <div className="max-w-2xl">
          <AjustesForm inicial={inicial} />
        </div>
      </div>
    </AppShell>
  );
}
