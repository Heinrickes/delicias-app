import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/** Shell estático para pantallas de carga — refleja el layout de AppShell sin llamadas async. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background p-2 text-foreground md:p-3">
      <div className="mx-auto flex max-w-[1540px] flex-col overflow-hidden rounded-xl border bg-surface shadow-[0_24px_80px_rgba(75,45,30,0.10)] lg:min-h-[calc(100vh-1.5rem)] lg:flex-row">
        {/* Sidebar */}
        <aside className="border-b bg-surface px-5 py-5 lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-1">
            <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
            <div className="space-y-1.5 lg:mt-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-2 w-20" />
            </div>
          </div>
        </aside>

        {/* Content */}
        <section className="min-w-0 flex-1 bg-surface px-5 pb-24 pt-6 md:px-8 lg:px-10 lg:pb-10">
          <div className="mb-6 flex items-center justify-end gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

/** Header skeleton estándar: eyebrow + título + subtítulo */
export function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

/** 3 tarjetas de métrica */
export function StatsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={`grid gap-4 ${count === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Lista de filas genérica */
export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Grid de tarjetas de producto */
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
          <Skeleton className="h-32 w-full rounded-none" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
