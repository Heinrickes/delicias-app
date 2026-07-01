"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Boxes, Coins, Factory, Settings, Truck, X } from "lucide-react";
import type { Aviso } from "@/lib/notificaciones-data";
import { cn } from "@/lib/utils";

const ICON = {
  entrega: Truck,
  cobro: Coins,
  stock: Boxes,
  produccion: Factory,
} as const;

function avisoKey(a: Aviso) {
  return `${a.tipo}-${a.refId}`;
}

function useDismissed(avisos: Aviso[]) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored: string[] = JSON.parse(
        localStorage.getItem("notif-dismissed") ?? "[]"
      );
      // Limpiar claves que ya no existen en los avisos actuales
      const currentKeys = new Set(avisos.map(avisoKey));
      const cleaned = stored.filter((k) => currentKeys.has(k));
      setDismissed(cleaned);
      if (cleaned.length !== stored.length) {
        localStorage.setItem("notif-dismissed", JSON.stringify(cleaned));
      }
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = (key: string) => {
    setDismissed((prev) => {
      const next = [...prev, key];
      localStorage.setItem("notif-dismissed", JSON.stringify(next));
      return next;
    });
  };

  const clearAll = (keys: string[]) => {
    setDismissed((prev) => {
      const next = [...new Set([...prev, ...keys])];
      localStorage.setItem("notif-dismissed", JSON.stringify(next));
      return next;
    });
  };

  return { dismissed, dismiss, clearAll };
}

export function NotificacionesBell({ avisos }: { avisos: Aviso[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { dismissed, dismiss, clearAll } = useDismissed(avisos);

  const visibles = avisos.filter((a) => !dismissed.includes(avisoKey(a)));
  const urgentes = visibles.filter((a) => a.urgente).length;
  const total = visibles.length;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group relative flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Notificaciones"
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
        <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-[100] -translate-x-1/2 whitespace-nowrap rounded-lg border bg-card px-2.5 py-1 text-[11px] font-semibold tracking-wide text-foreground shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          Notificaciones
        </span>
      </button>

      {open && (
        <div className="fixed inset-x-4 top-[7rem] z-50 overflow-hidden rounded-xl border bg-card shadow-2xl lg:absolute lg:inset-x-auto lg:right-0 lg:top-auto lg:mt-2 lg:w-80">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <p className="text-base font-semibold text-foreground">Avisos</p>
              {visibles.length >= 2 && (
                <button
                  type="button"
                  onClick={() => clearAll(visibles.map(avisoKey))}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Limpiar todo
                </button>
              )}
            </div>
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
              Todo al día
            </div>
          ) : (
            <ul className="max-h-96 divide-y overflow-y-auto">
              {visibles.map((a, i) => {
                const Icon = ICON[a.tipo];
                const key = avisoKey(a);
                return (
                  <li key={i} className="flex items-center gap-1 pr-2">
                    <Link
                      href={a.href}
                      onClick={() => setOpen(false)}
                      className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3 transition-colors hover:bg-background/60"
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
                            a.urgente
                              ? "text-danger"
                              : "text-muted-foreground"
                          )}
                        >
                          {a.detalle}
                        </p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => dismiss(key)}
                      aria-label="Descartar aviso"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
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
