"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Truck, Coins, Boxes, Factory, Settings } from "lucide-react";
import type { Aviso } from "@/lib/notificaciones-data";
import { cn } from "@/lib/utils";

const ICON = {
  entrega: Truck,
  cobro: Coins,
  stock: Boxes,
  produccion: Factory,
} as const;

export function NotificacionesBell({ avisos }: { avisos: Aviso[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const urgentes = avisos.filter((a) => a.urgente).length;
  const total = avisos.length;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Avisos"
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
              urgentes > 0 ? "bg-danger" : "bg-primary"
            )}
          >
            {total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-base font-semibold text-foreground">Avisos</p>
            <Link
              href="/ajustes"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-3.5 w-3.5" />
              Ajustes
            </Link>
          </div>

          {total === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Todo al día 🎉
            </div>
          ) : (
            <ul className="max-h-96 divide-y overflow-y-auto">
              {avisos.map((a, i) => {
                const Icon = ICON[a.tipo];
                return (
                  <li key={i}>
                    <Link
                      href={a.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-background/60"
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                          a.urgente
                            ? "bg-danger/10 text-danger"
                            : "bg-background text-gold"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {a.titulo}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            a.urgente ? "text-danger" : "text-muted-foreground"
                          )}
                        >
                          {a.detalle}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
