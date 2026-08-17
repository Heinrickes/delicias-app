"use client";

import { useTransition } from "react";
import { Pencil, Trash2, PackagePlus, Boxes } from "lucide-react";
import { toast } from "sonner";
import { eliminarProducto } from "@/lib/actions/productos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
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
import { StockMovimientoDialog } from "@/components/shared/StockMovimientoDialog";
import { ProductFormDialog } from "@/components/shared/ProductFormDialog";
import { CardPopover } from "@/components/shared/CardPopover";
import { formatMoneda, LABELS, STOCK_BAJO_UMBRAL } from "@/lib/constants";

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  costo: number;
  stock: number;
  stock_minimo?: number;
  categoria: string | null;
  categoria_id?: string | null;
  imagen_url?: string | null;
  tipo?: "simple" | "delicia";
  componentes?: { nombre: string; cantidad: number }[];
};

type Categoria = { id: string; nombre: string };

export function ProductCard({
  producto,
  categorias = [],
}: {
  producto: Producto;
  categorias?: Categoria[];
}) {
  const [deleting, startDeleting] = useTransition();

  const stock = producto.stock;
  const esDelicia = producto.tipo === "delicia";
  const margen = producto.precio - producto.costo;
  const margenPct =
    producto.precio > 0 ? Math.round((margen / producto.precio) * 100) : 0;
  const umbral = producto.stock_minimo ?? STOCK_BAJO_UMBRAL;
  const stockBajo = stock < umbral;

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

  return (
    <CardPopover
      imageUrl={producto.imagen_url ?? null}
      placeholder={
        <div className="absolute inset-0 flex items-center justify-center bg-muted p-2">
          {/* Sin foto: color liso y el nombre, para distinguir un producto
              de otro sin competir visualmente con las tarjetas que sí la tienen. */}
          <span className="line-clamp-3 text-center text-[11px] font-semibold leading-tight text-muted-foreground">
            {producto.nombre}
          </span>
        </div>
      }
      badge={
        <div className="flex flex-wrap gap-1">
          {esDelicia && (
            <Badge className="bg-primary text-primary-foreground">Delicia</Badge>
          )}
          {producto.categoria && (
            <Badge className="bg-card/85 text-foreground backdrop-blur">
              {producto.categoria}
            </Badge>
          )}
        </div>
      }
      title={producto.nombre}
      keyValue={
        <span className={cn("flex items-center justify-between", stockBajo && "text-danger")}>
          <span>{formatMoneda(producto.precio)}</span>
          <span className="inline-flex items-center gap-1">
            <Boxes className="h-3 w-3" />
            {stock}
          </span>
        </span>
      }
      fields={[
        { label: "Precio", value: formatMoneda(producto.precio) },
        { label: LABELS.costo, value: formatMoneda(producto.costo) },
        { label: "Margen", value: `${formatMoneda(margen)} (${margenPct}%)` },
        { label: "Stock", value: stock.toString() },
      ]}
      actions={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {!esDelicia && (
              <StockMovimientoDialog
                producto={{
                  id: producto.id,
                  nombre: producto.nombre,
                  stock: producto.stock,
                  stock_minimo: producto.stock_minimo,
                }}
                trigger={
                  <Tooltip content={stockBajo ? "Reponer" : "Stock"}>
                    <Button variant={stockBajo ? "default" : "outline"} size="icon-sm">
                      <PackagePlus className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                }
              />
            )}
            <ProductFormDialog
              categorias={categorias}
              producto={{
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                costo: producto.costo,
                categoria_id: producto.categoria_id ?? null,
                imagen_url: producto.imagen_url ?? null,
                tipo: producto.tipo,
              }}
              trigger={
                <Tooltip content={LABELS.editar}>
                  <Button variant="outline" size="icon-sm">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
              }
            />
          </div>
          <AlertDialog>
            <Tooltip content={LABELS.eliminar}>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={deleting}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />
            </Tooltip>
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
      }
    >
      {esDelicia && producto.componentes && producto.componentes.length > 0 && (
        <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
          {producto.componentes.map((c) => `${c.cantidad}× ${c.nombre}`).join(", ")}
        </p>
      )}
    </CardPopover>
  );
}
