"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleCardField {
  label: string;
  value: React.ReactNode;
  className?: string;
}

interface CollapsibleCardProps {
  icon?: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  subtitle?: React.ReactNode;
  fields?: CollapsibleCardField[];
  actions?: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function CollapsibleCard({
  icon,
  title,
  badge,
  subtitle,
  fields,
  actions,
  defaultExpanded = false,
  className,
  children,
}: CollapsibleCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={cn("rounded-xl bg-card ring-1 ring-foreground/10", className)}>
      {/* Header — siempre visible, clic para colapsar/expandir */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 p-3.5 text-left"
      >
        {icon && (
          <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {title}
            </span>
            {badge}
          </div>
          {subtitle && (
            <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>
          )}
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Cuerpo colapsable — CSS grid trick para animación suave */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-foreground/8 px-3.5 pb-3.5 pt-3">
            {fields && fields.length > 0 && (
              <dl className="space-y-2">
                {fields.map((f, i) => (
                  <div key={i} className={cn("flex items-start justify-between gap-2", f.className)}>
                    <dt className="shrink-0 text-xs text-muted-foreground">{f.label}</dt>
                    <dd className="text-right text-xs font-medium text-foreground">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {children}
            {actions && (
              <div className="mt-3 flex gap-2 border-t border-foreground/8 pt-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
