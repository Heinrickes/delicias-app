"use client";

import { useState } from "react";
import { ListFilter, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/shared/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  costo: number;
  stock: number;
  stock_minimo?: number;
  categoria: string | null;
  categoria_id?: string | null;
  imagen_url?: string | null;
  tipo?: "simple" | "delicia";
  componentes?: { nombre: string; cantidad: number }[];
};

type Categoria = { id: string; nombre: string };

export function ProductosGrid({
  productos,
  categorias,
}: {
  productos: Producto[];
  categorias: Categoria[];
}) {
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());

  const toggleCategoria = (id: string) => {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtrados =
    seleccionadas.size === 0
      ? productos
      : productos.filter((p) => p.categoria_id && seleccionadas.has(p.categoria_id));

  return (
    <div className="space-y-4">
      {categorias.length > 0 && (
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm" className="gap-1.5">
                <ListFilter className="h-3.5 w-3.5" />
                Categorías
                {seleccionadas.size > 0 && (
                  <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {seleccionadas.size}
                  </span>
                )}
              </Button>
            }
          />
          <PopoverContent align="start" className="w-64 p-1">
            <div className="max-h-72 overflow-y-auto">
              {categorias.map((c) => {
                const activa = seleccionadas.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategoria(c.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        activa
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-foreground/20"
                      )}
                    >
                      {activa && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate text-foreground">{c.nombre}</span>
                  </button>
                );
              })}
            </div>
            {seleccionadas.size > 0 && (
              <div className="border-t pt-1">
                <button
                  type="button"
                  onClick={() => setSeleccionadas(new Set())}
                  className="w-full rounded-md px-2.5 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Limpiar selección
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {filtrados.map((producto, index) => (
          <ProductCard
            key={producto.id}
            producto={producto}
            categorias={categorias}
            variant={index % 4}
          />
        ))}
      </div>
    </div>
  );
}
