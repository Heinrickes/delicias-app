import { ReactNode } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MainNav } from "@/components/shared/MainNav";
import { MobileNav } from "@/components/shared/MobileNav";
import { UserNav } from "@/components/shared/UserNav";
import { NotificacionesBell } from "@/components/shared/NotificacionesBell";
import { getAvisos } from "@/lib/notificaciones-data";

async function getUserEmail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.email;
}

export async function AppShell({ children }: { children: ReactNode }) {
  const [email, avisos] = await Promise.all([getUserEmail(), getAvisos()]);

  return (
    <main className="min-h-screen bg-background p-2 text-foreground md:p-3">
      <div className="mx-auto flex max-w-[1540px] flex-col overflow-hidden rounded-xl border bg-surface shadow-[0_24px_80px_rgba(75,45,30,0.10)] lg:min-h-[calc(100vh-1.5rem)] lg:flex-row">
        <aside className="border-b bg-surface px-5 py-5 lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-4 lg:mb-8 lg:block">
            <div>
              <p className="font-serif text-[1.7rem] leading-none text-primary">
                Delicias
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-muted-foreground">
                Caseras
              </p>
            </div>
          </div>

          <MainNav />

          <div className="mt-10 hidden rounded-lg border bg-background/60 p-4 text-center lg:block lg:mt-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
              Hecho con amor
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Ingredientes seleccionados y dedicacion en cada detalle.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 bg-surface px-5 pb-24 pt-6 md:px-8 lg:px-10 lg:pb-10">
          <div className="mb-6 flex items-center justify-end gap-2">
            <NotificacionesBell avisos={avisos} />
            <Link
              href="/ajustes"
              className="flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Ajustes"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <UserNav email={email} />
          </div>

          {children}
        </section>
      </div>

      <MobileNav />
    </main>
  );
}
