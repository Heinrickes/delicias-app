import { ReactNode } from "react";
import Link from "next/link";
import { ChefHat, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MainNav } from "@/components/shared/MainNav";
import { MobileNav } from "@/components/shared/MobileNav";
import { UserNav } from "@/components/shared/UserNav";
import { AgendarProduccionDialog } from "@/components/shared/AgendarProduccionDialog";
import Image from "next/image";
import { NotificacionesBell } from "@/components/shared/NotificacionesBell";
import { getAvisos } from "@/lib/notificaciones-data";

async function getUserEmail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.email;
}

async function getProductosSimples() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("productos")
    .select("id, nombre")
    .eq("activo", true)
    .eq("tipo", "simple")
    .order("nombre");
  return (data ?? []) as { id: string; nombre: string }[];
}

export async function AppShell({ children }: { children: ReactNode }) {
  const [email, avisos, productos] = await Promise.all([
    getUserEmail(),
    getAvisos(),
    getProductosSimples(),
  ]);

  const badgeCounts = avisos.reduce(
    (acc, a) => {
      acc[a.href] = (acc[a.href] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <main className="min-h-screen bg-background p-2 text-foreground md:p-3">
      <div className="mx-auto flex max-w-[1540px] flex-col overflow-hidden rounded-xl border bg-surface shadow-[0_24px_80px_rgba(75,45,30,0.10)] lg:min-h-[calc(100vh-1.5rem)] lg:flex-row">
        <aside className="border-b bg-surface px-5 py-5 lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-4 lg:mb-8 lg:block">
            <div className="flex items-center gap-3 lg:flex-col lg:items-center lg:gap-1 lg:text-center">
              <Image
                src="/logo-oficial.png"
                alt=""
                width={140}
                height={140}
                className="h-14 w-14 shrink-0 object-contain lg:h-32 lg:w-32"
              />
              <div className="lg:mt-2">
                <p className="font-serif text-[1.35rem] leading-[1.02] text-primary">
                  Delicias Caseras
                </p>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.26em] text-gold">
                  Chocolate artesanal
                </p>
              </div>
            </div>
          </div>

          <MainNav badgeCounts={badgeCounts} />

          <div className="mt-10 hidden rounded-lg border bg-background/60 p-4 text-center lg:block lg:mt-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
              Hecho con dedicación
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Disfrutado con intención. Chocolate fino artesanal.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 bg-surface px-5 pb-24 pt-6 md:px-8 lg:px-10 lg:pb-10">
          <div className="mb-6 flex items-center justify-end gap-2">
            <NotificacionesBell avisos={avisos} />
            <AgendarProduccionDialog
              productos={productos}
              trigger={
                <button
                  type="button"
                  className="group relative flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Agendar producción"
                >
                  <ChefHat className="h-4 w-4" />
                  <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-[100] -translate-x-1/2 whitespace-nowrap rounded-lg border bg-card px-2.5 py-1 text-[11px] font-semibold tracking-wide text-foreground shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    Agendar producción
                  </span>
                </button>
              }
            />
            <Link
              href="/ajustes"
              className="group relative flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Ajustes"
            >
              <Settings className="h-4 w-4" />
              <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-[100] -translate-x-1/2 whitespace-nowrap rounded-lg border bg-card px-2.5 py-1 text-[11px] font-semibold tracking-wide text-foreground shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                Ajustes
              </span>
            </Link>
            <UserNav email={email} />
          </div>

          {children}
        </section>
      </div>

      <MobileNav badgeCounts={badgeCounts} />
    </main>
  );
}
