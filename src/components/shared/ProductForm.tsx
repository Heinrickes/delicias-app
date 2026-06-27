"use client";

import { useState, useTransition } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { crearProducto } from "@/lib/actions/productos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LABELS } from "@/lib/constants";

const EMPTY = { nombre: "", categoria_id: "", precio: "", costo: "", stock: "", unidad: "" };

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
        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Plus className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold text-primary">
            Nuevo producto
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
              <Label>Categoría</Label>
              <Select
                value={form.categoria_id || "none"}
                onValueChange={(v) => set("categoria_id", !v || v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-9 w-full">
                  <span className={cn("flex-1 text-left text-sm", !form.categoria_id && "text-muted-foreground")}>
                    {form.categoria_id
                      ? categorias.find((c) => c.id === form.categoria_id)?.nombre ?? "Sin categoría"
                      : "Sin categoría"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="precio">{LABELS.precio} de venta</Label>
              <NumericInput
                id="precio"
                required
                min="0"
                value={form.precio}
                onChange={(v) => set("precio", v)}
                placeholder="1500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="costo">{LABELS.costo} de producción</Label>
              <NumericInput
                id="costo"
                min="0"
                value={form.costo}
                onChange={(v) => set("costo", v)}
                placeholder="600"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stock">{LABELS.stockInicial}</Label>
              <NumericInput
                id="stock"
                required
                min="0"
                value={form.stock}
                onChange={(v) => set("stock", v)}
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
