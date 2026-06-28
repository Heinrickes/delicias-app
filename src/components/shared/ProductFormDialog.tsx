"use client";

import {
  cloneElement,
  isValidElement,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Plus } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { LABELS } from "@/lib/constants";

type Categoria = { id: string; nombre: string };

const EMPTY = {
  nombre: "",
  categoria_id: "",
  precio: "",
  costo: "",
  stock: "",
  stock_minimo: "",
  unidad: "unidad",
};

export function ProductFormDialog({
  categorias,
  trigger,
}: {
  categorias: Categoria[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [isPending, startTransition] = useTransition();

  const set = (campo: keyof typeof EMPTY, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const precio = parseInt(form.precio) || 0;
  const costo = parseInt(form.costo) || 0;
  const margen = precio > 0 ? Math.round(((precio - costo) / precio) * 100) : null;

  const resetForm = () => setForm(EMPTY);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await crearProducto({
        nombre: form.nombre,
        precio,
        costo,
        stock: parseInt(form.stock) || 0,
        categoria_id: form.categoria_id || null,
        unidad: form.unidad,
      });

      if (result.ok) {
        toast.success("Producto agregado");
        setOpen(false);
        resetForm();
      } else {
        toast.error(result.error || LABELS.errorGuardar);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
      {isValidElement(trigger)
        ? cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
            onClick: () => setOpen(true),
          })
        : trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
          <DialogDescription>
            Agrega un producto simple al catálogo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Información principal */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Información principal
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="pf-nombre">{LABELS.nombre}</Label>
              <Input
                id="pf-nombre"
                required
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Ej: Alfajor de Nuez"
                autoFocus
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
          </div>

          {/* Comercial */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Comercial
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pf-precio">{LABELS.precio} de venta</Label>
                <NumericInput
                  id="pf-precio"
                  required
                  min="0"
                  value={form.precio}
                  onChange={(v) => set("precio", v)}
                  placeholder="1500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-costo">{LABELS.costo}</Label>
                <NumericInput
                  id="pf-costo"
                  min="0"
                  value={form.costo}
                  onChange={(v) => set("costo", v)}
                  placeholder="600"
                />
              </div>
            </div>
            {margen !== null && (
              <p className="text-xs text-muted-foreground">
                Margen:{" "}
                <span className={cn("font-semibold", margen >= 30 ? "text-success" : margen >= 10 ? "text-gold" : "text-danger")}>
                  {margen}%
                </span>
              </p>
            )}
          </div>

          {/* Inventario */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Inventario
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pf-stock">{LABELS.stockInicial}</Label>
                <NumericInput
                  id="pf-stock"
                  min="0"
                  value={form.stock}
                  onChange={(v) => set("stock", v)}
                  placeholder="12"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unidad</Label>
                <Select
                  value={form.unidad}
                  onValueChange={(v) => set("unidad", v ?? "unidad")}
                >
                  <SelectTrigger className="h-9 w-full">
                    <span className="flex-1 text-left text-sm">{form.unidad || "unidad"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {["unidad", "kg", "g", "l", "ml"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              <Plus className="h-4 w-4" />
              {isPending ? LABELS.guardando : "Agregar producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
