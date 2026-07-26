"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ActionButtonColor = "primary" | "terracota" | "gold" | "success";

const COLOR_CLASSES: Record<
  ActionButtonColor,
  { hover: string; circle: string; label: string }
> = {
  primary: {
    hover: "hover:bg-primary/10",
    circle: "bg-primary text-primary-foreground",
    label: "text-primary",
  },
  terracota: {
    hover: "hover:bg-terracotta/10",
    circle: "bg-terracotta text-white",
    label: "text-terracotta",
  },
  gold: {
    hover: "hover:bg-gold/10",
    circle: "bg-gold text-white",
    label: "text-gold",
  },
  success: {
    hover: "hover:bg-success/10",
    circle: "bg-success text-white",
    label: "text-success",
  },
};

export function ActionButton({
  icon,
  label,
  color = "primary",
  badge,
  disabled = false,
  onClick,
  className,
}: {
  icon: ReactNode;
  label: string;
  color?: ActionButtonColor;
  /** Contador opcional mostrado como badge sobre el círculo (p. ej. items en el carrito). */
  badge?: number;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const c = COLOR_CLASSES[color];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors disabled:opacity-50",
        c.hover,
        className
      )}
    >
      <span
        className={cn(
          "relative flex h-12 w-12 items-center justify-center rounded-full shadow",
          c.circle
        )}
      >
        {icon}
        {typeof badge === "number" && badge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </span>
      <span className={cn("text-center text-[11px] font-semibold leading-tight", c.label)}>
        {label}
      </span>
    </button>
  );
}
