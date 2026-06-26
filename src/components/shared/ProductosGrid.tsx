"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/shared/ProductCard";

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
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);

  const filtrados = categoriaActiva
    ? productos.filter((p) => p.categoria_id === categoriaActiva)
    : productos;

  return (
    <div className="space-y-4">
      {categorias.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoriaActiva(null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !categoriaActiva
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"
            )}
          >
            Todos
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoriaActiva(c.id === categoriaActiva ? null : c.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                categoriaActiva === c.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"
              )}
            >
              {c.nombre}
            </button>
          ))}
        </div>
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
