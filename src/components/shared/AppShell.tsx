import { ReactNode } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { MainNav } from "@/components/shared/MainNav";
import { UserNav } from "@/components/shared/UserNav";
import { Bell, Search } from "lucide-react";

async function getUserEmail() {
  const cookieStore = await cookies();
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  return user?.email;
}

export async function AppShell({ children }: { children: ReactNode }) {
  const email = await getUserEmail();

  return (
    <main className="min-h-screen bg-background p-2 text-foreground md:p-3">
      <div className="mx-auto flex max-w-[1540px] flex-col overflow-hidden rounded-xl border bg-surface shadow-[0_24px_80px_rgba(75,45,30,0.10)] lg:min-h-[calc(100vh-1.5rem)] lg:flex-row">
        <aside className="border-b bg-surface px-5 py-5 lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="mb-8 flex items-center justify-between gap-4 lg:block">
            <div>
              <p className="font-serif text-[1.7rem] leading-none text-accent">
                Delicias
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-muted">
                Caseras
              </p>
            </div>
          </div>

          <MainNav />

          <div className="mt-10 hidden rounded-lg border bg-background/60 p-4 text-center lg:block lg:mt-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
              Hecho con amor
            </p>
            <p className="mt-2 text-xs leading-5 text-muted">
              Ingredientes seleccionados y dedicacion en cada detalle.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 bg-surface px-5 py-6 md:px-8 lg:px-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-2xl leading-tight text-foreground md:text-[2rem]">
                Bienvenido, Enrique
              </h1>
              <p className="mt-2 text-xs text-muted">
                Resumen general de tu taller
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted transition-colors hover:text-foreground"
                title="Buscar"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted transition-colors hover:text-foreground"
                title="Notificaciones"
              >
                <Bell className="h-4 w-4" />
              </button>
              <UserNav email={email} />
            </div>
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}
