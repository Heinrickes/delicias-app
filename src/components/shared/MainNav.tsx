"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Package,
  Receipt,
  Users,
} from "lucide-react";
import { clsx } from "clsx";

const primaryItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/#productos", label: "Productos", icon: Package },
  { href: "/ventas", label: "Ventas", icon: Receipt },
];

const futureItems = [
  { label: "Stock", icon: Boxes },
  { label: "Clientes", icon: Users },
  { label: "Reportes", icon: BarChart3 },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto lg:flex-col lg:items-stretch lg:overflow-visible">
      {primaryItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={clsx(
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
              isActive
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted hover:bg-background/70 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}

      <div className="mx-2 hidden h-px bg-border lg:my-3 lg:block" />

      {futureItems.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.label}
            type="button"
            disabled
            className="inline-flex min-h-10 shrink-0 cursor-not-allowed items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-muted-foreground opacity-70 lg:w-full"
            title={`${item.label} se activara en la siguiente etapa`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
