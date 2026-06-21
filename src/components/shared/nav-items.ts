import {
  BarChart3,
  Boxes,
  ClipboardList,
  Coins,
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Ítems de navegación, compartidos por la sidebar (desktop) y el bottom-nav (móvil). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: Receipt },
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/por-cobrar", label: "Por cobrar", icon: Coins },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/stock", label: "Inventario", icon: Boxes },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

export function isActive(pathname: string, href: string) {
  const base = href.split("#")[0];
  return base === "/" ? pathname === "/" : pathname.startsWith(base);
}
