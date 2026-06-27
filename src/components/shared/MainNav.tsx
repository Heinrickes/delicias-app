"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { NAV_ITEMS, isActive } from "@/components/shared/nav-items";

export function MainNav({
  badgeCounts = {},
}: {
  badgeCounts?: Record<string, number>;
}) {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex lg:flex-col lg:items-stretch lg:gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        const hasBadge = !!(badgeCounts[item.href]);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={clsx(
              "relative inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
            )}
          >
            <span className="relative">
              <Icon className="h-4 w-4" />
              {hasBadge && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-danger ring-1 ring-surface" />
              )}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
