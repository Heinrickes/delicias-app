import {
  Banknote,
  BarChart3,
  Boxes,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Ítems de navegación, compartidos por la sidebar (desktop) y el bottom-nav (móvil). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: Receipt },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/stock", label: "Inventario", icon: Boxes },
  { href: "/costos", label: "Compras", icon: ShoppingCart },
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/por-cobrar", label: "Por cobrar", icon: Banknote },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/reportes", label: "Estadísticas", icon: BarChart3 },
];

export function isActive(pathname: string, href: string) {
  const base = href.split("#")[0];
  return base === "/" ? pathname === "/" : pathname.startsWith(base);
}
