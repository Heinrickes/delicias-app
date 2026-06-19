"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  Receipt,
  Users,
} from "lucide-react";
import { clsx } from "clsx";

const primaryItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/ventas", label: "Ventas", icon: Receipt },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto lg:flex-col lg:items-stretch lg:overflow-visible">
      {primaryItems.map((item) => {
        const Icon = item.icon;
        const base = item.href.split("#")[0];
        const isActive =
          base === "/" ? pathname === "/" : pathname.startsWith(base);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={clsx(
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
