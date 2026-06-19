"use client";

import {
  cloneElement,
  isValidElement,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { crearPack } from "@/lib/actions/packs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoneda, LABELS } from "@/lib/constants";

type ProductoBase = { id: string; nombre: string; precio: number };
type Item = { producto_id: string; nombre: string; precio: number; cantidad: number };

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function PackFormDialog({
  productos,
  trigger,
}: {
  productos: ProductoBase[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precio, setPrecio] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [prodSel, setProdSel] = useState("");
  const [cantSel, setCantSel] = useState("1");
  const [isPending, startTransition] = useTransition();

  const suelto = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const precioNum = parseInt(precio) || 0;
  const ahorro = suelto > 0 ? suelto - precioNum : 0;

  const reset = () => {
    setNombre("");
    setCategoria("");
    setPrecio("");
    setItems([]);
    setProdSel("");
    setCantSel("1");
  };

  const agregar = () => {
    const prod = productos.find((p) => p.id === prodSel);
    const cant = parseInt(cantSel);
    if (!prod) return toast.error("Elige un producto");
    if (!Number.isFinite(cant) || cant <= 0) return toast.error("Cantidad inválida");
    setItems((prev) => {
      const existe = prev.find((i) => i.producto_id === prod.id);
      if (existe) {
        return prev.map((i) =>
          i.producto_id === prod.id ? { ...i, cantidad: i.cantidad + cant } : i
        );
      }
      return [
        ...prev,
        { producto_id: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: cant },
      ];
    });
    setProdSel("");
    setCantSel("1");
  };

  const quitar = (id: string) =>
    setItems((prev) => prev.filter((i) => i.producto_id !== id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Agrega al menos un producto");
    startTransition(async () => {
      const result = await crearPack({
        nombre,
        precio: precioNum,
        categoria,
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
      });
      if (result.ok) {
        toast.success("Pack creado");
        reset();
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      {isValidElement(trigger)
        ? cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
            onClick: () => setOpen(true),
          })
        : trigger}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo pack</DialogTitle>
          <DialogDescription>
            Un pack agrupa productos a un precio especial. Al venderlo se
            descuenta el stock de cada producto base.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pnombre">{LABELS.nombre} del pack</Label>
              <Input
                id="pnombre"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Pack de 3 Alfajores"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pcat">Categoría</Label>
              <Input
                id="pcat"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Packs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pprecio">{LABELS.precio} del pack</Label>
              <Input
                id="pprecio"
                type="number"
                required
                min="0"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="2500"
              />
            </div>
          </div>

          {/* Componentes */}
          <div className="space-y-2 rounded-lg border bg-background/40 p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="pprod">Producto</Label>
                <select
                  id="pprod"
                  value={prodSel}
                  onChange={(e) => setProdSel(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Elige…</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({formatMoneda(p.precio)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-20 space-y-1.5">
                <Label htmlFor="pcant">Cant.</Label>
                <Input
                  id="pcant"
                  type="number"
                  min="1"
                  value={cantSel}
                  onChange={(e) => setCantSel(e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" size="icon" onClick={agregar}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {items.length > 0 && (
              <ul className="divide-y rounded-md border bg-card">
                {items.map((i) => (
                  <li
                    key={i.producto_id}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-medium text-foreground">
                        {i.cantidad}×
                      </span>{" "}
                      {i.nombre}
                    </span>
                    <button
                      type="button"
                      onClick={() => quitar(i.producto_id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {items.length > 0 && (
              <div className="flex items-center justify-between px-1 pt-1 text-xs">
                <span className="text-muted-foreground">
                  Por separado: {formatMoneda(suelto)}
                </span>
                {ahorro > 0 && precioNum > 0 && (
                  <span className="font-medium text-success">
                    Ahorro: {formatMoneda(ahorro)}
                  </span>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? LABELS.guardando : "Crear pack"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
