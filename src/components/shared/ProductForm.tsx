"use client";

import { useState, useTransition } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { crearProducto } from "@/lib/actions/productos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LABELS } from "@/lib/constants";

const EMPTY = { nombre: "", categoria_id: "", precio: "", costo: "", stock: "", unidad: "" };

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Categoria = { id: string; nombre: string };

export function ProductForm({ categorias }: { categorias: Categoria[] }) {
  const [form, setForm] = useState(EMPTY);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const set = (campo: keyof typeof EMPTY, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await crearProducto({
        nombre: form.nombre,
        precio: parseInt(form.precio) || 0,
        costo: parseInt(form.costo) || 0,
        stock: parseInt(form.stock) || 0,
        categoria_id: form.categoria_id || null,
        unidad: form.unidad,
      });

      if (result.ok) {
        toast.success("Producto agregado");
        setForm(EMPTY);
        setIsExpanded(false);
      } else {
        toast.error(result.error || LABELS.errorGuardar);
      }
    });
  };

  return (
    <div className="mb-8 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Plus className="h-4 w-4 text-primary" />
          </span>
          <span className="text-sm font-medium text-foreground">
            Agregar nuevo producto
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="border-t px-5 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nombre">{LABELS.nombre} del producto</Label>
              <Input
                id="nombre"
                required
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Ej: Alfajor de Nuez"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="categoria">Categoría</Label>
              <select
                id="categoria"
                value={form.categoria_id}
                onChange={(e) => set("categoria_id", e.target.value)}
                className={selectClass}
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="precio">{LABELS.precio} de venta</Label>
              <Input
                id="precio"
                type="number"
                required
                min="0"
                value={form.precio}
                onChange={(e) => set("precio", e.target.value)}
                placeholder="1500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="costo">{LABELS.costo} de producción</Label>
              <Input
                id="costo"
                type="number"
                min="0"
                value={form.costo}
                onChange={(e) => set("costo", e.target.value)}
                placeholder="600"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stock">{LABELS.stockInicial}</Label>
              <Input
                id="stock"
                type="number"
                required
                min="0"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                placeholder="12"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsExpanded(false)}
            >
              {LABELS.cancelar}
            </Button>
            <Button type="submit" disabled={isPending}>
              <Plus className="h-4 w-4" />
              {isPending ? LABELS.guardando : "Agregar producto"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
