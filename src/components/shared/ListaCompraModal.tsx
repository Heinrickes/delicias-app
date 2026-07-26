"use client";

import { useRef, useState, useTransition } from "react";
import { Check, X, Trash2, Save, Loader2 } from "lucide-react";
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
import { Tooltip } from "@/components/ui/tooltip";
import { completarCompra, actualizarPreciosCompra, borrarCompra, type CompraItem } from "@/lib/actions/compras";
import { formatMoneda, LABELS } from "@/lib/constants";
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
  const cerrarRef = useRef<HTMLButtonElement>(null);

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
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md"
        initialFocus={cerrarRef}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
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
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col />
              <col className="w-14" />
              <col className="w-24" />
              <col className="w-28" />
            </colgroup>
            <thead>
              <tr className="border-b">
                <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Insumo
                </th>
                <th scope="col" className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Cant.
                </th>
                <th scope="col" className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Precio
                </th>
                <th scope="col" className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.insumo_id}>
                  <td className="px-3 py-2.5">
                    <span className="block truncate text-sm text-foreground">{item.nombre}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm tabular-nums text-muted-foreground">
                    {item.cantidad}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {isPlanificada ? (
                      <input
                        type="number"
                        min="0"
                        step="any"
                        defaultValue={item.precio_unitario || ""}
                        onBlur={(e) => setPrecio(item.insumo_id, e.target.value)}
                        placeholder="0"
                        className="h-7 w-20 rounded border border-foreground/15 bg-transparent px-1.5 text-right text-sm tabular-nums outline-none focus:border-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        aria-label="Precio unitario"
                      />
                    ) : (
                      <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                        {formatMoneda(item.precio_unitario)}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm font-semibold tabular-nums text-foreground">
                    {formatMoneda(item.precio_unitario * item.cantidad)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t">
                <td colSpan={2} className="px-3 py-3 text-sm text-muted-foreground">
                  Total
                </td>
                <td />
                <td className="whitespace-nowrap px-3 py-3 text-right text-lg font-bold tabular-nums text-foreground">
                  {formatMoneda(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {lista.notas && (
          <p className="mt-2 text-xs text-muted-foreground">Notas: {lista.notas}</p>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tooltip content="Cerrar" side="top">
              <Button ref={cerrarRef} variant="ghost" size="icon-sm" onClick={() => handleOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </Tooltip>

            {isPlanificada && (
              <AlertDialog>
                <Tooltip content={LABELS.eliminar} side="top">
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isPending}
                        className="text-danger hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </Tooltip>
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

          {isPlanificada && (
            <div className="flex items-center gap-2">
              <Tooltip content="Guardar precios" side="top">
                <Button
                  variant="outline"
                  disabled={isPending || editItems.length === 0}
                  onClick={guardarPrecios}
                  size="icon-sm"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </Tooltip>
              <Tooltip content="Completar compra" side="top">
                <Button
                  disabled={isPending}
                  onClick={completar}
                  size="icon-sm"
                  className="bg-success text-white hover:bg-success/90"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </Tooltip>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
