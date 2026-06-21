"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { NAV_ITEMS, isActive } from "@/components/shared/nav-items";

/** Barra de navegación fija inferior (solo móvil), ergonómica para el pulgar. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch gap-0.5 overflow-x-auto border-t bg-surface/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur lg:hidden">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={clsx(
              "flex min-w-[4.3rem] shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold leading-none transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
