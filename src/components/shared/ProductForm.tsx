"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";

export function ProductForm() {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("productos").insert([
      {
        nombre: nombre,
        precio: parseInt(precio),
        stock: parseInt(stock),
        categoria: "Nuevo Ingreso",
      },
    ]);

    if (!error) {
      setNombre("");
      setPrecio("");
      setStock("");
      setIsExpanded(false);
      router.refresh();
    } else {
      console.error("Error al crear producto:", error);
      alert("Hubo un error al guardar el producto.");
    }

    setLoading(false);
  };

  return (
    <div className="mb-8 rounded-xl border bg-card">
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-background/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <Plus className="h-4 w-4 text-accent" />
          </div>
          <span className="text-sm font-medium text-foreground">
            Agregar nuevo producto
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
      </button>

      {/* Expandable Form */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="border-t px-5 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
                Nombre del producto
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
                placeholder="Ej: Alfajor de Nuez"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
                Precio
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                  $
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="w-full rounded-lg border bg-background py-2.5 pl-7 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
                  placeholder="1500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
                Stock inicial
              </label>
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
                placeholder="12"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {loading ? "Guardando..." : "Agregar producto"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
