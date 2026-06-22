"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Check,
  X,
  ShoppingCart,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  crearInsumo,
  actualizarInsumo,
  eliminarInsumo,
  ajustarStockInsumo,
  toggleEnLista,
} from "@/lib/actions/insumos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatMoneda } from "@/lib/constants";

export type Insumo = {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
  stock_minimo: number;
  costo_unitario: number;
  proveedor: string | null;
  en_lista: boolean;
};

const EMPTY = {
  nombre: "",
  unidad: "",
  stock: "",
  stock_minimo: "",
  costo_unitario: "",
  proveedor: "",
};

export function CostosManager({ insumos }: { insumos: Insumo[] }) {
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof EMPTY, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const agregar = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await crearInsumo({
        nombre: form.nombre,
        unidad: form.unidad,
        stock: parseFloat(form.stock) || 0,
        stock_minimo: parseFloat(form.stock_minimo) || 0,
        costo_unitario: parseInt(form.costo_unitario) || 0,
        proveedor: form.proveedor,
      });
      if (r.ok) {
        toast.success("Insumo agregado");
        setForm(EMPTY);
        setOpenForm(false);
      } else toast.error(r.error);
    });
  };

  const porComprar = insumos.filter(
    (i) => i.stock < i.stock_minimo || i.en_lista
  );
  const totalCompra = porComprar.reduce((s, i) => {
    const faltan = Math.max(i.stock_minimo - i.stock, 0) || 1;
    return s + faltan * i.costo_unitario;
  }, 0);

  return (
    <div className="space-y-8">
      {/* Agregar insumo */}
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <button
          type="button"
          onClick={() => setOpenForm((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/50"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Plus className="h-4 w-4 text-primary" />
            </span>
            <span className="text-sm font-medium text-foreground">
              Agregar insumo
            </span>
          </span>
          {openForm ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {openForm && (
          <form onSubmit={agregar} className="border-t px-5 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="i-nombre">Nombre</Label>
                <Input
                  id="i-nombre"
                  required
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  placeholder="Ej: Harina"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-unidad">Unidad</Label>
                <Input
                  id="i-unidad"
                  value={form.unidad}
                  onChange={(e) => set("unidad", e.target.value)}
                  placeholder="kg, l, unidad…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-stock">Stock actual</Label>
                <Input
                  id="i-stock"
                  type="number"
                  step="any"
                  value={form.stock}
                  onChange={(e) => set("stock", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-min">Stock mínimo</Label>
                <Input
                  id="i-min"
                  type="number"
                  step="any"
                  value={form.stock_minimo}
                  onChange={(e) => set("stock_minimo", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-costo">Costo unitario</Label>
                <Input
                  id="i-costo"
                  type="number"
                  value={form.costo_unitario}
                  onChange={(e) => set("costo_unitario", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-prov">Proveedor</Label>
                <Input
                  id="i-prov"
                  value={form.proveedor}
                  onChange={(e) => set("proveedor", e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setOpenForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                <Plus className="h-4 w-4" />
                Agregar insumo
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Lista de compras */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <ShoppingCart className="h-4 w-4" />
            Lista de compras ({porComprar.length})
          </h3>
          {porComprar.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Estimado: {formatMoneda(totalCompra)}
            </span>
          )}
        </div>
        {porComprar.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
            Nada por comprar. Marca un insumo con ★ o deja que el stock bajo lo
            agregue solo.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {porComprar.map((i) => {
              const faltan = Math.max(i.stock_minimo - i.stock, 0);
              return (
                <div
                  key={i.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-card p-3 ring-1 ring-foreground/10"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {i.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Faltan {faltan > 0 ? `${faltan} ${i.unidad}` : "—"} ·{" "}
                      {i.proveedor ?? "sin proveedor"}
                    </p>
                  </div>
                  {i.en_lista && !(i.stock < i.stock_minimo) && (
                    <Badge className="bg-gold/15 text-gold">manual</Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Inventario de insumos */}
      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Insumos ({insumos.length})
        </h3>
        {insumos.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
            Aún no hay insumos. Agrega el primero arriba.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Insumo</th>
                    <th className="px-4 py-3 font-semibold">Proveedor</th>
                    <th className="px-4 py-3 text-center font-semibold">Stock</th>
                    <th className="px-4 py-3 text-right font-semibold">Costo</th>
                    <th className="px-4 py-3 text-center font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {insumos.map((i) => (
                    <InsumoRow key={i.id} insumo={i} pending={pending} start={start} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function InsumoRow({
  insumo,
  pending,
  start,
}: {
  insumo: Insumo;
  pending: boolean;
  start: React.TransitionStartFunction;
}) {
  const [editStock, setEditStock] = useState(false);
  const [stockVal, setStockVal] = useState(insumo.stock.toString());
  const [openEdit, setOpenEdit] = useState(false);
  const bajo = insumo.stock < insumo.stock_minimo;

  const guardarStock = () =>
    start(async () => {
      const r = await ajustarStockInsumo(insumo.id, parseFloat(stockVal) || 0);
      if (r.ok) {
        toast.success("Stock actualizado");
        setEditStock(false);
      } else toast.error(r.error);
    });

  const toggle = () =>
    start(async () => {
      const r = await toggleEnLista(insumo.id, !insumo.en_lista);
      if (!r.ok) toast.error(r.error);
    });

  const borrar = () =>
    start(async () => {
      const r = await eliminarInsumo(insumo.id);
      if (r.ok) toast.success("Insumo eliminado");
      else toast.error(r.error);
    });

  return (
    <tr className="hover:bg-background/30">
      <td className="px-4 py-3 font-medium text-foreground">{insumo.nombre}</td>
      <td className="px-4 py-3 text-muted-foreground">{insumo.proveedor ?? "—"}</td>
      <td className="px-4 py-3 text-center tabular-nums">
        {editStock ? (
          <span className="inline-flex items-center gap-1">
            <Input
              type="number"
              step="any"
              value={stockVal}
              onChange={(e) => setStockVal(e.target.value)}
              className="h-8 w-20 text-center"
            />
            <Button size="icon-sm" onClick={guardarStock} disabled={pending}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => setEditStock(false)}>
              <X className="h-4 w-4" />
            </Button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setStockVal(insumo.stock.toString());
              setEditStock(true);
            }}
            className="rounded px-2 py-0.5 hover:bg-background"
            title="Ajustar stock"
          >
            {insumo.stock} <span className="text-xs text-muted-foreground">{insumo.unidad}</span>
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
        {formatMoneda(insumo.costo_unitario)}
      </td>
      <td className="px-4 py-3 text-center">
        <Badge className={bajo ? "bg-danger/15 text-danger" : "bg-success/15 text-success"}>
          {bajo ? "Comprar" : "OK"}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={toggle}
            disabled={pending}
            title={insumo.en_lista ? "Quitar de la lista" : "Agregar a la lista"}
            className={cn(insumo.en_lista && "text-gold")}
          >
            <Star className={cn("h-4 w-4", insumo.en_lista && "fill-current")} />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setOpenEdit(true)}
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={borrar}
            disabled={pending}
            title="Eliminar"
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>

      <EditInsumoDialog insumo={insumo} open={openEdit} setOpen={setOpenEdit} start={start} pending={pending} />
    </tr>
  );
}

function EditInsumoDialog({
  insumo,
  open,
  setOpen,
  start,
  pending,
}: {
  insumo: Insumo;
  open: boolean;
  setOpen: (v: boolean) => void;
  start: React.TransitionStartFunction;
  pending: boolean;
}) {
  const [nombre, setNombre] = useState(insumo.nombre);
  const [unidad, setUnidad] = useState(insumo.unidad);
  const [min, setMin] = useState(insumo.stock_minimo.toString());
  const [costo, setCosto] = useState(insumo.costo_unitario.toString());
  const [proveedor, setProveedor] = useState(insumo.proveedor ?? "");

  const guardar = () =>
    start(async () => {
      const r = await actualizarInsumo(insumo.id, {
        nombre,
        unidad,
        stock_minimo: parseFloat(min) || 0,
        costo_unitario: parseInt(costo) || 0,
        proveedor,
      });
      if (r.ok) {
        toast.success("Insumo actualizado");
        setOpen(false);
      } else toast.error(r.error);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar insumo</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Unidad</Label>
            <Input value={unidad} onChange={(e) => setUnidad(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Stock mínimo</Label>
            <Input type="number" step="any" value={min} onChange={(e) => setMin(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Costo unitario</Label>
            <Input type="number" value={costo} onChange={(e) => setCosto(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Proveedor</Label>
            <Input value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={guardar} disabled={pending}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
