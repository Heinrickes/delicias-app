"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, List } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de reporte con toggle gráfico ↔ lista.
 * Recibe el gráfico y la lista ya renderizados y alterna entre ambos.
 */
export function SeccionReporte({
  titulo,
  subtitulo,
  chart,
  lista,
}: {
  titulo: string;
  subtitulo: string;
  chart: ReactNode;
  lista: ReactNode;
}) {
  const [vista, setVista] = useState<"grafico" | "lista">("grafico");

  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{titulo}</h3>
          <p className="text-xs text-muted-foreground">{subtitulo}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 rounded-lg bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setVista("grafico")}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              vista === "grafico"
                ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/10"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Ver gráfico"
            aria-label="Ver gráfico"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setVista("lista")}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              vista === "lista"
                ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/10"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Ver lista"
            aria-label="Ver lista"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
      {vista === "grafico" ? chart : lista}
    </div>
  );
}
