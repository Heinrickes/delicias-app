"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  ClipboardList,
  Coins,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Users,
} from "lucide-react";
import { isActive } from "@/components/shared/nav-items";

const PRIMARY = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/por-cobrar", label: "Por cobrar", icon: Coins },
];

const SECONDARY = [
  { href: "/stock", label: "Inventario", icon: Boxes },
  { href: "/costos", label: "Costos", icon: ShoppingCart },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isSecondaryActive = SECONDARY.some((item) => isActive(pathname, item.href));

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Contenedor unificado: drawer + barra, anclado al fondo */}
      <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden">

        {/* Drawer secundario: crece hacia arriba con max-h */}
        <div
          className={clsx(
            "overflow-hidden transition-all duration-300 ease-out",
            open ? "max-h-56 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="bg-card px-4 pb-4 pt-3 shadow-2xl ring-1 ring-foreground/10">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Más páginas
            </p>
            <div className="grid grid-cols-5 gap-1">
              {SECONDARY.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      "flex flex-col items-center gap-1.5 rounded-xl py-3 text-[10px] font-semibold leading-none transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Barra de navegación principal */}
        <nav className="border-t bg-surface/95 backdrop-blur">
          {/* Handle: toca para abrir/cerrar el drawer */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-center py-1.5"
            aria-label={open ? "Cerrar menú" : "Ver más páginas"}
          >
            <div
              className={clsx(
                "h-1 w-8 rounded-full transition-colors duration-200",
                open || isSecondaryActive ? "bg-primary/60" : "bg-foreground/20"
              )}
            />
          </button>

          {/* Ítems + FAB */}
          <div className="flex items-end pb-[env(safe-area-inset-bottom)]">
            {/* Izquierda */}
            {PRIMARY.slice(0, 2).map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={clsx(
                    "flex flex-1 flex-col items-center gap-1 pb-2.5 pt-0.5 text-[10px] font-semibold leading-none transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}

            {/* FAB central — Ventas */}
            <div className="flex flex-col items-center px-3 pb-2">
              <Link
                href="/ventas"
                className={clsx(
                  "-mt-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200",
                  isActive(pathname, "/ventas")
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/25 scale-105"
                    : "bg-primary text-primary-foreground ring-4 ring-background hover:scale-105 hover:bg-primary/90"
                )}
              >
                <Receipt className="h-6 w-6" />
              </Link>
              <span
                className={clsx(
                  "mt-1 text-[10px] font-semibold leading-none",
                  isActive(pathname, "/ventas") ? "text-primary" : "text-muted-foreground"
                )}
              >
                Ventas
              </span>
            </div>

            {/* Derecha */}
            {PRIMARY.slice(2).map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={clsx(
                    "flex flex-1 flex-col items-center gap-1 pb-2.5 pt-0.5 text-[10px] font-semibold leading-none transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
