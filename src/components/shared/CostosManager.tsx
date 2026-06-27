"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Check,
  ShoppingCart,
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
import { NumericInput } from "@/components/ui/numeric-input";
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
          className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-muted/30"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              <Plus className="h-6 w-6" />
            </span>
            <span className="text-sm font-semibold text-primary">
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
                <NumericInput
                  id="i-stock"
                  step="any"
                  value={form.stock}
                  onChange={(v) => set("stock", v)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-min">Stock mínimo</Label>
                <NumericInput
                  id="i-min"
                  step="any"
                  value={form.stock_minimo}
                  onChange={(v) => set("stock_minimo", v)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-costo">Costo unitario</Label>
                <NumericInput
                  id="i-costo"
                  value={form.costo_unitario}
                  onChange={(v) => set("costo_unitario", v)}
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

      {/* Inventario de insumos — cards */}
      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Insumos ({insumos.length})
        </h3>
        {insumos.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
            Aún no hay insumos. Agrega el primero arriba.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {insumos.map((i) => (
              <InsumoCard key={i.id} insumo={i} pending={pending} start={start} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InsumoCard({
  insumo,
  pending,
  start,
}: {
  insumo: Insumo;
  pending: boolean;
  start: React.TransitionStartFunction;
}) {
  const [open, setOpen] = useState(false);
  const bajo = insumo.stock < insumo.stock_minimo;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full flex-col gap-2 rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition-all hover:ring-primary/40 hover:shadow-sm active:scale-[0.98]"
      >
        <div className="flex items-start justify-between gap-1">
          <p className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
            {insumo.nombre}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold leading-none",
              bajo ? "bg-danger/15 text-danger" : "bg-success/15 text-success"
            )}
          >
            {bajo ? "Bajo" : "OK"}
          </span>
        </div>

        <p className="text-xl font-bold tabular-nums text-foreground">
          {insumo.stock}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            {insumo.unidad}
          </span>
        </p>

        <p className="text-xs text-muted-foreground">
          {formatMoneda(insumo.costo_unitario)} / {insumo.unidad}
        </p>

        {insumo.proveedor && (
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
            {insumo.proveedor}
          </p>
        )}

        {insumo.en_lista && (
          <span className="inline-flex w-fit rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
            en lista
          </span>
        )}
      </button>

      <InsumoGestorDialog
        insumo={insumo}
        open={open}
        setOpen={setOpen}
        pending={pending}
        start={start}
      />
    </>
  );
}

function InsumoGestorDialog({
  insumo,
  open,
  setOpen,
  pending,
  start,
}: {
  insumo: Insumo;
  open: boolean;
  setOpen: (v: boolean) => void;
  pending: boolean;
  start: React.TransitionStartFunction;
}) {
  const [stockVal, setStockVal] = useState(insumo.stock.toString());
  const [nombre, setNombre] = useState(insumo.nombre);
  const [unidad, setUnidad] = useState(insumo.unidad);
  const [min, setMin] = useState(insumo.stock_minimo.toString());
  const [costo, setCosto] = useState(insumo.costo_unitario.toString());
  const [proveedor, setProveedor] = useState(insumo.proveedor ?? "");

  const bajo = insumo.stock < insumo.stock_minimo;

  const ajustarStock = () =>
    start(async () => {
      const r = await ajustarStockInsumo(insumo.id, parseFloat(stockVal) || 0);
      if (r.ok) toast.success("Stock actualizado");
      else toast.error(r.error);
    });

  const toggle = () =>
    start(async () => {
      const r = await toggleEnLista(insumo.id, !insumo.en_lista);
      if (!r.ok) toast.error(r.error);
    });

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

  const borrar = () =>
    start(async () => {
      const r = await eliminarInsumo(insumo.id);
      if (r.ok) {
        toast.success("Insumo eliminado");
        setOpen(false);
      } else toast.error(r.error);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{insumo.nombre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Stock */}
          <div className="space-y-2">
            <Label>Stock actual</Label>
            <div className="flex gap-2">
              <NumericInput
                step="any"
                value={stockVal}
                onChange={setStockVal}
                className="flex-1"
                placeholder={insumo.stock.toString()}
              />
              <Button onClick={ajustarStock} disabled={pending} className="gap-1.5">
                <Check className="h-4 w-4" />
                Guardar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mínimo: {insumo.stock_minimo} {insumo.unidad} ·{" "}
              <span className={bajo ? "text-danger" : "text-success"}>
                {bajo ? "Stock bajo" : "Suficiente"}
              </span>
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Editar datos
            </p>
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
                <Input
                  type="number"
                  step="any"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Costo unitario</Label>
                <Input
                  type="number"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Proveedor</Label>
                <Input
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={toggle}
              disabled={pending}
              className={cn(
                "gap-1.5 text-xs",
                insumo.en_lista ? "text-success" : "text-muted-foreground"
              )}
            >
              <ShoppingCart className="h-4 w-4" />
              {insumo.en_lista ? "Quitar de lista" : "Agregar a lista"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={borrar}
              disabled={pending}
              className="gap-1.5 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={pending}>
              <Pencil className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
