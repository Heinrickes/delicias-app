"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Pencil, Trash2, X, Check, PackagePlus, Boxes, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { actualizarProducto, eliminarProducto } from "@/lib/actions/productos";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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

const productVisuals = [
  "radial-gradient(circle at 35% 45%, #F3D9B8 0 10%, transparent 11%), radial-gradient(circle at 55% 50%, #F3D9B8 0 11%, transparent 12%), radial-gradient(circle at 72% 45%, #F3D9B8 0 10%, transparent 11%), linear-gradient(135deg, #D5B38D, #F2E5D1)",
  "radial-gradient(circle at 42% 48%, #3C2117 0 12%, #8A5A3C 13% 16%, transparent 17%), radial-gradient(circle at 60% 44%, #3C2117 0 10%, #8A5A3C 11% 15%, transparent 16%), linear-gradient(135deg, #E7D6C4, #B98C65)",
  "linear-gradient(90deg, transparent 0 12%, #E8D5B9 13% 22%, #4B2D1E 23% 31%, transparent 32% 36%, #E8D5B9 37% 47%, #4B2D1E 48% 58%, transparent 59%), linear-gradient(135deg, #D2B894, #F7E7CF)",
  "radial-gradient(circle at 35% 40%, #6D4029 0 9%, transparent 10%), radial-gradient(circle at 55% 52%, #3B2118 0 11%, transparent 12%), radial-gradient(circle at 72% 42%, #8A5A3C 0 9%, transparent 10%), linear-gradient(135deg, #EFE1D2, #B58A68)",
];

export function ProductCard({
  producto,
  categorias = [],
  variant = 0,
}: {
  producto: Producto;
  categorias?: Categoria[];
  variant?: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState(producto.nombre);
  const [editPrecio, setEditPrecio] = useState(producto.precio.toString());
  const [editCosto, setEditCosto] = useState(producto.costo.toString());
  const [editCategoria, setEditCategoria] = useState(producto.categoria_id ?? "");
  const [editImagenUrl, setEditImagenUrl] = useState(producto.imagen_url ?? null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();

  const stock = producto.stock;
  const esDelicia = producto.tipo === "delicia";
  const margen = producto.precio - producto.costo;
  const margenPct =
    producto.precio > 0 ? Math.round((margen / producto.precio) * 100) : 0;
  const umbral = producto.stock_minimo ?? STOCK_BAJO_UMBRAL;
  const stockBajo = stock < umbral;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${producto.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("productos").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Error al subir la imagen");
      setUploadingImage(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("productos").getPublicUrl(path);
    setEditImagenUrl(publicUrl);
    setUploadingImage(false);
  };

  const handleGuardarEdicion = () => {
    startSaving(async () => {
      const result = await actualizarProducto(producto.id, {
        nombre: editNombre,
        precio: parseInt(editPrecio) || 0,
        costo: esDelicia ? 0 : parseInt(editCosto) || 0,
        categoria_id: editCategoria || null,
        imagen_url: editImagenUrl,
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
    setEditCategoria(producto.categoria_id ?? "");
    setEditImagenUrl(producto.imagen_url ?? null);
  };

  return (
    <div className="group relative overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-[0_14px_34px_rgba(75,45,30,0.08)]">
      <div
        className="relative h-16 bg-cover bg-center"
        style={
          (isEditing ? editImagenUrl : producto.imagen_url)
            ? undefined
            : { background: productVisuals[variant % productVisuals.length] }
        }
      >
        {(isEditing ? editImagenUrl : producto.imagen_url) && (
          <Image
            src={(isEditing ? editImagenUrl : producto.imagen_url)!}
            alt={producto.nombre}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        )}
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
          {esDelicia && (
            <Badge className="bg-primary text-primary-foreground">Delicia</Badge>
          )}
          {producto.categoria && (
            <Badge className="bg-card/85 text-foreground backdrop-blur">
              {producto.categoria}
            </Badge>
          )}
        </div>
        {/* Overlay de cambio de imagen (solo en edición) */}
        {isEditing && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="absolute inset-0 flex items-center justify-center bg-foreground/30"
          >
            {uploadingImage ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <ImagePlus className="h-5 w-5 text-white drop-shadow" />
            )}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      <div className="p-3">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              placeholder="Nombre del producto"
            />
            <div className={`grid gap-2 ${esDelicia ? "grid-cols-1" : "grid-cols-2"}`}>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  {LABELS.precio}
                </span>
                <NumericInput
                  value={editPrecio}
                  onChange={setEditPrecio}
                  placeholder="Precio"
                />
              </div>
              {!esDelicia && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    {LABELS.costo}
                  </span>
                  <NumericInput
                    value={editCosto}
                    onChange={setEditCosto}
                    placeholder="Costo"
                  />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Categoría</span>
              <Select
                value={editCategoria || "none"}
                onValueChange={(v) => setEditCategoria(!v || v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-9 w-full">
                  <span className={cn("flex-1 text-left text-sm", !editCategoria && "text-muted-foreground")}>
                    {editCategoria
                      ? categorias.find((c) => c.id === editCategoria)?.nombre ?? "Sin categoría"
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
            <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
              {producto.nombre}
            </h3>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-base font-semibold tabular-nums text-foreground">
                {formatMoneda(producto.precio)}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${stockBajo ? "bg-danger/10 text-danger" : "bg-background text-muted-foreground"}`}
              >
                <Boxes className="h-3 w-3" />
                {stock}
              </span>
            </div>

            {esDelicia && producto.componentes && producto.componentes.length > 0 && (
              <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
                {producto.componentes
                  .map((c) => `${c.cantidad}× ${c.nombre}`)
                  .join(", ")}
              </p>
            )}

            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                {LABELS.costo}: {formatMoneda(producto.costo)}
              </span>
              <span className="font-medium text-success">
                {formatMoneda(margen)} ({margenPct}%)
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5 border-t pt-2.5">
              {!esDelicia && (
                <StockMovimientoDialog
                  producto={{
                    id: producto.id,
                    nombre: producto.nombre,
                    stock: producto.stock,
                    stock_minimo: producto.stock_minimo,
                  }}
                  trigger={
                    <Button
                      variant={stockBajo ? "default" : "outline"}
                      size="sm"
                      className="flex-1 gap-1.5"
                      title={stockBajo ? "Reponer stock urgente" : "Gestionar movimientos de stock"}
                    >
                      {stockBajo ? (
                        <PackagePlus className="h-4 w-4" />
                      ) : (
                        <Boxes className="h-4 w-4" />
                      )}
                      <span className="sm:hidden lg:inline">
                        {stockBajo ? "Reponer" : "Stock"}
                      </span>
                    </Button>
                  }
                />
              )}
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
          </>
        )}
      </div>
    </div>
  );
}
