"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type HistorialEvento = {
  id: string;
  descripcion: string;
  when: string;
  amount?: string;
  amountTone?: "pos" | "neg" | "neutral";
  /** Iniciales del autor (D3). Omitir si el registro no tiene autor (histórico previo al login). */
  author?: string | null;
};

export type HistorialChip = {
  key: string;
  /** Etiqueta del período: "Hoy", "Esta semana", "Junio", etc. */
  label: string;
  count: number;
  amountLabel: string;
  eventos: HistorialEvento[];
};

const AMOUNT_TONE_CLASS: Record<NonNullable<HistorialEvento["amountTone"]>, string> = {
  pos: "text-success",
  neg: "text-danger",
  neutral: "text-foreground",
};

export function HistorialTimeline({
  title = "Historial",
  lastEventLabel,
  chips,
  defaultChipKey,
  className,
}: {
  title?: string;
  /** Subtítulo del header, p. ej. "Último: hoy, 11:20". */
  lastEventLabel?: string;
  chips: HistorialChip[];
  defaultChipKey?: string;
  className?: string;
}) {
  const [minimized, setMinimized] = useState(false);
  const [activeKey, setActiveKey] = useState(defaultChipKey ?? chips[0]?.key);

  const active = chips.find((c) => c.key === activeKey) ?? chips[0];

  if (minimized) {
    return (
      <div className={cn("rounded-xl bg-card ring-1 ring-foreground/10", className)}>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-foreground">
            {title}
            {lastEventLabel && (
              <span className="text-muted-foreground"> · {lastEventLabel}</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="rounded-md border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Expandir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10", className)}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {lastEventLabel && (
            <p className="mt-0.5 text-xs text-muted-foreground">{lastEventLabel}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMinimized(true)}
          className="rounded-md border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Minimizar
        </button>
      </div>

      {chips.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          Todavía no hay movimientos.
        </p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto px-4 py-3">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveKey(c.key)}
                className={cn(
                  "min-w-[6.5rem] shrink-0 rounded-lg border p-2.5 text-left transition-colors",
                  c.key === active?.key
                    ? "border-terracotta bg-terracotta/8"
                    : "border-foreground/10 hover:border-foreground/20"
                )}
              >
                <p className="text-[11px] text-muted-foreground">{c.label}</p>
                <p
                  className={cn(
                    "mt-1 text-sm font-semibold",
                    c.key === active?.key ? "text-terracotta" : "text-foreground"
                  )}
                >
                  {c.count} {c.count === 1 ? "evento" : "eventos"}
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                  {c.amountLabel}
                </p>
              </button>
            ))}
          </div>

          {active && (
            <div className="border-t px-4 pb-2 pt-1">
              {active.eventos.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Sin eventos en este período.
                </p>
              ) : (
                active.eventos.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-2.5 border-b py-2.5 last:border-b-0"
                  >
                    {e.author && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white">
                        {e.author}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {e.descripcion}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{e.when}</span>
                    {e.amount && (
                      <span
                        className={cn(
                          "shrink-0 text-sm font-semibold tabular-nums",
                          AMOUNT_TONE_CLASS[e.amountTone ?? "neutral"]
                        )}
                      >
                        {e.amount}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
