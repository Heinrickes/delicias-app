"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Banknote,
  BarChart3,
  Boxes,
  CalendarDays,
  ClipboardList,
  Grid2X2,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { isActive } from "@/components/shared/nav-items";

const PRIMARY = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/productos", label: "Productos", icon: Package },
  // FAB Ventas en el centro
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
];

// Páginas en el drawer (el slot 5 de la barra es el botón "Más")
const SECONDARY = [
  { href: "/por-cobrar", label: "Por cobrar", icon: Banknote },
  { href: "/stock", label: "Inventario", icon: Boxes },
  { href: "/costos", label: "Costos", icon: ShoppingCart },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

export function MobileNav({
  badgeCounts = {},
}: {
  badgeCounts?: Record<string, number>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isSecondaryActive = SECONDARY.some((item) => isActive(pathname, item.href));

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer de páginas secundarias */}
      {open && (
        <div className="fixed inset-x-0 bottom-[3.75rem] z-50 lg:hidden">
          <div className="mx-2 mb-2 overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-foreground/10">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Más páginas
              </p>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-px border-t border-foreground/5 bg-foreground/5">
              {SECONDARY.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                const hasBadge = !!(badgeCounts[item.href]);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 bg-card px-2 py-4 text-[11px] font-semibold leading-none transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "relative flex h-10 w-10 items-center justify-center rounded-xl",
                        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {hasBadge && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-card" />
                      )}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Barra de navegación */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-surface/95 backdrop-blur lg:hidden">
        <div
          className="flex items-end"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Dashboard, Productos */}
          {PRIMARY.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            const hasBadge = !!(badgeCounts[item.href]);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 pb-2.5 pt-1.5 text-[10px] font-semibold leading-none transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {hasBadge && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-danger ring-1 ring-surface" />
                  )}
                </span>
                {item.label}
              </Link>
            );
          })}

          {/* FAB central — Ventas */}
          <div className="flex flex-col items-center px-3 pb-2">
            <Link
              href="/ventas"
              className={cn(
                "-mt-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200",
                isActive(pathname, "/ventas")
                  ? "scale-105 bg-primary text-primary-foreground ring-4 ring-primary/25"
                  : "bg-primary text-primary-foreground ring-4 ring-background hover:scale-105"
              )}
            >
              <Receipt className="h-6 w-6" />
            </Link>
            <span
              className={cn(
                "mt-1 text-[10px] font-semibold leading-none",
                isActive(pathname, "/ventas") ? "text-primary" : "text-muted-foreground"
              )}
            >
              Ventas
            </span>
          </div>

          {/* Pedidos */}
          {PRIMARY.slice(2).map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            const hasBadge = !!(badgeCounts[item.href]);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 pb-2.5 pt-1.5 text-[10px] font-semibold leading-none transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {hasBadge && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-danger ring-1 ring-surface" />
                  )}
                </span>
                {item.label}
              </Link>
            );
          })}

          {/* Botón "Más" — slot 5 */}
          <button
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 pb-2.5 pt-1.5 text-[10px] font-semibold leading-none transition-colors",
              open || isSecondaryActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Grid2X2 className="h-5 w-5" />
            Más
          </button>
        </div>
      </nav>
    </>
  );
}
