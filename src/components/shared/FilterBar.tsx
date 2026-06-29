"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface FilterBarProps {
  placeholder?: string;
  categorias?: string[];
  onSearch: (q: string) => void;
  onCategoria?: (cat: string | null) => void;
  className?: string;
}

export function FilterBar({
  placeholder = "Buscar...",
  categorias,
  onSearch,
  onCategoria,
  className,
}: FilterBarProps) {
  const [query, setQuery] = useState("");
  const [catActiva, setCatActiva] = useState<string | null>(null);

  function handleSearch(value: string) {
    setQuery(value);
    onSearch(value);
  }

  function handleCat(cat: string | null) {
    setCatActiva(cat);
    onCategoria?.(cat);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-8 pr-8 text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {categorias && categorias.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleCat(null)}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
              catActiva === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Todos
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCat(cat === catActiva ? null : cat)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                catActiva === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
