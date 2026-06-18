"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X, Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import {
  actualizarProducto,
  eliminarProducto,
  venderProducto,
} from "@/lib/actions/productos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { formatMoneda, LABELS, STOCK_BAJO_UMBRAL } from "@/lib/constants";

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  costo: number;
  stock: number;
  categoria: string | null;
};

const productVisuals = [
  "radial-gradient(circle at 35% 45%, #F3D9B8 0 10%, transparent 11%), radial-gradient(circle at 55% 50%, #F3D9B8 0 11%, transparent 12%), radial-gradient(circle at 72% 45%, #F3D9B8 0 10%, transparent 11%), linear-gradient(135deg, #D5B38D, #F2E5D1)",
  "radial-gradient(circle at 42% 48%, #3C2117 0 12%, #8A5A3C 13% 16%, transparent 17%), radial-gradient(circle at 60% 44%, #3C2117 0 10%, #8A5A3C 11% 15%, transparent 16%), linear-gradient(135deg, #E7D6C4, #B98C65)",
  "linear-gradient(90deg, transparent 0 12%, #E8D5B9 13% 22%, #4B2D1E 23% 31%, transparent 32% 36%, #E8D5B9 37% 47%, #4B2D1E 48% 58%, transparent 59%), linear-gradient(135deg, #D2B894, #F7E7CF)",
  "radial-gradient(circle at 35% 40%, #6D4029 0 9%, transparent 10%), radial-gradient(circle at 55% 52%, #3B2118 0 11%, transparent 12%), radial-gradient(circle at 72% 42%, #8A5A3C 0 9%, transparent 10%), linear-gradient(135deg, #EFE1D2, #B58A68)",
];

export function ProductCard({
  producto,
  variant = 0,
}: {
  producto: Producto;
  variant?: number;
}) {
  const [stock, setStock] = useState(producto.stock);
  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState(producto.nombre);
  const [editPrecio, setEditPrecio] = useState(producto.precio.toString());
  const [editCosto, setEditCosto] = useState(producto.costo.toString());
  const [selling, startSelling] = useTransition();
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();

  const margen = producto.precio - producto.costo;
  const margenPct =
    producto.precio > 0 ? Math.round((margen / producto.precio) * 100) : 0;
  const stockBajo = stock < STOCK_BAJO_UMBRAL;

  const handleVender = () => {
    if (stock <= 0) return;
    startSelling(async () => {
      const result = await venderProducto(producto.id);
      if (result.ok && result.data) {
        setStock(result.data.stock);
        toast.success(`Venta registrada: ${producto.nombre}`);
      } else if (!result.ok) {
        toast.error(result.error);
      }
    });
  };

  const handleGuardarEdicion = () => {
    startSaving(async () => {
      const result = await actualizarProducto(producto.id, {
        nombre: editNombre,
        precio: parseInt(editPrecio) || 0,
        costo: parseInt(editCosto) || 0,
      });
      if (result.ok) {
        toast.success("Producto actualizado");
        setIsEditing(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleBorrar = () => {
    startDeleting(async () => {
      const result = await eliminarProducto(producto.id);
      if (result.ok) {
        toast.success("Producto eliminado");
      } else {
        toast.error(result.error);
      }
    });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditNombre(producto.nombre);
    setEditPrecio(producto.precio.toString());
    setEditCosto(producto.costo.toString());
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-[0_18px_40px_rgba(75,45,30,0.10)]">
      <div
        className="relative h-32 border-b bg-cover bg-center"
        style={{ background: productVisuals[variant % productVisuals.length] }}
      >
        {producto.categoria && (
          <Badge className="absolute left-3 top-3 bg-card/85 text-foreground backdrop-blur">
            {producto.categoria}
          </Badge>
        )}
      </div>

      <div className="absolute right-3 top-3 flex gap-1 rounded-md bg-card/80 p-1 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsEditing((v) => !v)}
          title={LABELS.editar}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={deleting}
                title={LABELS.eliminar}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
              <AlertDialogDescription>
                Se ocultará &quot;{producto.nombre}&quot; del inventario. El
                historial de ventas se conserva.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{LABELS.cancelar}</AlertDialogCancel>
              <AlertDialogAction onClick={handleBorrar}>
                {LABELS.eliminar}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              placeholder="Nombre del producto"
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  {LABELS.precio}
                </span>
                <Input
                  type="number"
                  value={editPrecio}
                  onChange={(e) => setEditPrecio(e.target.value)}
                  placeholder="Precio"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  {LABELS.costo}
                </span>
                <Input
                  type="number"
                  value={editCosto}
                  onChange={(e) => setEditCosto(e.target.value)}
                  placeholder="Costo"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1"
                onClick={handleGuardarEdicion}
                disabled={saving}
              >
                <Check className="h-4 w-4" />
                {saving ? LABELS.guardando : LABELS.guardar}
              </Button>
              <Button variant="outline" size="icon" onClick={cancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-serif text-base leading-snug text-foreground">
              {producto.nombre}
            </h3>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {formatMoneda(producto.precio)}
              </span>
              <span
                className={`text-xs font-medium ${stockBajo ? "text-danger" : "text-muted-foreground"}`}
              >
                {LABELS.stock}: {stock}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {LABELS.costo}: {formatMoneda(producto.costo)}
              </span>
              <span className="font-medium text-success">
                {LABELS.margen}: {formatMoneda(margen)} ({margenPct}%)
              </span>
            </div>

            <Button
              className="mt-4 w-full"
              onClick={handleVender}
              disabled={selling || stock <= 0}
              variant={stock <= 0 ? "secondary" : "default"}
            >
              <ShoppingBag className="h-4 w-4" />
              {selling
                ? LABELS.procesando
                : stock <= 0
                  ? LABELS.agotado
                  : LABELS.registrarVenta}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
