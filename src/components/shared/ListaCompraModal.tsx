"use client";

import { useState, useTransition } from "react";
import { Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { completarCompra, actualizarPreciosCompra, borrarCompra, type CompraItem } from "@/lib/actions/compras";
import { formatMoneda } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ListaCompra = {
  id: string;
  nombre: string | null;
  estado: string;
  total: number;
  proveedor: string | null;
  notas: string | null;
  fecha_planificada: string | null;
  fecha_completada: string | null;
  items: CompraItem[];
};

export function ListaCompraModal({
  lista,
  open,
  onOpenChange,
}: {
  lista: ListaCompra | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [editItems, setEditItems] = useState<CompraItem[]>([]);
  const [isPending, startTransition] = useTransition();

  if (!lista) return null;

  const isPlanificada = lista.estado === "planificado";
  const items = editItems.length ? editItems : lista.items;
  const total = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

  const handleOpen = (v: boolean) => {
    if (!v) setEditItems([]);
    onOpenChange(v);
  };

  const setPrecio = (insumo_id: string, raw: string) => {
    const num = parseFloat(raw.replace(",", "."));
    const base = editItems.length ? editItems : lista.items;
    setEditItems(
      base.map((i) =>
        i.insumo_id === insumo_id
          ? { ...i, precio_unitario: Number.isFinite(num) && num >= 0 ? num : i.precio_unitario }
          : i
      )
    );
  };

  const guardarPrecios = () => {
    startTransition(async () => {
      const r = await actualizarPreciosCompra(lista.id, items);
      if (r.ok) toast.success("Precios actualizados");
      else toast.error(r.error);
    });
  };

  const completar = () => {
    startTransition(async () => {
      if (editItems.length) {
        const r = await actualizarPreciosCompra(lista.id, editItems);
        if (!r.ok) { toast.error(r.error); return; }
      }
      const r = await completarCompra(lista.id);
      if (r.ok) {
        toast.success("Compra completada · stock actualizado");
        handleOpen(false);
      } else {
        toast.error(r.error);
      }
    });
  };

  const eliminar = () => {
    startTransition(async () => {
      const r = await borrarCompra(lista.id);
      if (r.ok) {
        toast.success("Lista eliminada");
        handleOpen(false);
      } else {
        toast.error(r.error);
      }
    });
  };

  const titulo = lista.nombre || "Lista sin nombre";

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <span className="truncate">{titulo}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                isPlanificada
                  ? "bg-gold/15 text-gold"
                  : "bg-success/15 text-success"
              )}
            >
              {isPlanificada ? "Planificada" : "Completada"}
            </span>
          </DialogTitle>
          {(lista.fecha_planificada || lista.fecha_completada) && (
            <p className="text-xs text-muted-foreground">
              {isPlanificada ? "Para el " : "Completada el "}
              {new Date(
                (lista.fecha_planificada ?? lista.fecha_completada)!
              ).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
          {lista.proveedor && (
            <p className="text-xs text-muted-foreground">Proveedor: {lista.proveedor}</p>
          )}
        </DialogHeader>

        {/* Tabla de ítems */}
        <div className="mt-2 divide-y rounded-lg border">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Insumo</span>
            <span className="text-right">Cant.</span>
            <span className="text-right">Precio</span>
            <span className="text-right">Total</span>
          </div>
          {items.map((item) => (
            <div
              key={item.insumo_id}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 px-3 py-2.5"
            >
              <span className="truncate text-sm text-foreground">{item.nombre}</span>
              <span className="text-right text-sm tabular-nums text-muted-foreground">
                {item.cantidad}
              </span>
              {isPlanificada ? (
                <input
                  type="number"
                  min="0"
                  step="any"
                  defaultValue={item.precio_unitario || ""}
                  onBlur={(e) => setPrecio(item.insumo_id, e.target.value)}
                  placeholder="0"
                  className="w-20 rounded border border-foreground/15 bg-transparent px-1.5 py-0.5 text-right text-sm tabular-nums outline-none focus:border-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  aria-label="Precio unitario"
                />
              ) : (
                <span className="text-right text-sm tabular-nums text-muted-foreground">
                  {formatMoneda(item.precio_unitario)}
                </span>
              )}
              <span className="text-right text-sm font-semibold tabular-nums text-foreground">
                {formatMoneda(item.precio_unitario * item.cantidad)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between px-3 py-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              {formatMoneda(total)}
            </span>
          </div>
        </div>

        {lista.notas && (
          <p className="mt-2 text-xs text-muted-foreground">Notas: {lista.notas}</p>
        )}

        {/* Acciones */}
        <div className="mt-4 flex flex-col gap-2">
          {isPlanificada && (
            <>
              {editItems.length > 0 && (
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={guardarPrecios}
                  className="w-full"
                >
                  Guardar precios
                </Button>
              )}
              <button
                type="button"
                disabled={isPending}
                onClick={completar}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Completar compra · stock actualizado
              </button>
            </>
          )}

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => handleOpen(false)}
              className="flex-1"
            >
              <X className="mr-1.5 h-4 w-4" />
              Cerrar
            </Button>

            {isPlanificada && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    disabled={isPending}
                    className="text-danger hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar lista?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se eliminará «{titulo}» permanentemente. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={eliminar}
                      className="bg-danger text-white hover:bg-danger/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
