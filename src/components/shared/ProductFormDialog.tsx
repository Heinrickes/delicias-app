"use client";

import {
  cloneElement,
  isValidElement,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import Image from "next/image";
import { Camera, Check, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { actualizarProducto, crearProducto } from "@/lib/actions/productos";
import { createClient } from "@/lib/supabase/client";
import { ImageCropEditor } from "@/components/shared/ImageCropEditor";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
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

type ProductoEdit = {
  id: string;
  nombre: string;
  precio: number;
  costo: number;
  categoria_id: string | null;
  imagen_url: string | null;
  tipo?: "simple" | "delicia";
};

const EMPTY = {
  nombre: "",
  categoria_id: "",
  precio: "",
  costo: "",
  stock: "",
  stock_minimo: "",
  unidad: "unidad",
};

function formFromProducto(producto?: ProductoEdit) {
  if (!producto) return EMPTY;
  return {
    ...EMPTY,
    nombre: producto.nombre,
    categoria_id: producto.categoria_id ?? "",
    precio: producto.precio.toString(),
    costo: producto.costo.toString(),
  };
}

export function ProductFormDialog({
  categorias,
  trigger,
  producto,
}: {
  categorias: Categoria[];
  trigger: ReactNode;
  producto?: ProductoEdit;
}) {
  const esEdicion = !!producto;
  const esDelicia = producto?.tipo === "delicia";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => formFromProducto(producto));
  const [imagenUrl, setImagenUrl] = useState<string | null>(producto?.imagen_url ?? null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [archivoParaRecortar, setArchivoParaRecortar] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const set = (campo: keyof typeof EMPTY, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const precio = parseInt(form.precio) || 0;
  const costo = parseInt(form.costo) || 0;
  const margen = precio > 0 ? Math.round(((precio - costo) / precio) * 100) : null;

  const resetForm = () => {
    setForm(formFromProducto(producto));
    setImagenUrl(producto?.imagen_url ?? null);
    setArchivoParaRecortar(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivoParaRecortar(file);
    e.target.value = "";
  };

  const subirImagenRecortada = async (blob: Blob) => {
    setArchivoParaRecortar(null);
    setUploadingImage(true);
    const supabase = createClient();
    const path = `${producto?.id ?? "nuevo"}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("productos")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (error) {
      toast.error("Error al subir la imagen");
      setUploadingImage(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("productos").getPublicUrl(path);
    setImagenUrl(publicUrl);
    setUploadingImage(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = esEdicion
        ? await actualizarProducto(producto.id, {
            nombre: form.nombre,
            precio,
            costo: esDelicia ? 0 : costo,
            categoria_id: form.categoria_id || null,
            imagen_url: imagenUrl,
          })
        : await crearProducto({
            nombre: form.nombre,
            precio,
            costo,
            stock: parseInt(form.stock) || 0,
            categoria_id: form.categoria_id || null,
            unidad: form.unidad,
            imagen_url: imagenUrl,
          });

      if (result.ok) {
        toast.success(esEdicion ? "Producto actualizado" : "Producto agregado");
        setOpen(false);
        if (!esEdicion) resetForm();
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
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          <DialogDescription>
            {esEdicion
              ? "Actualiza los datos del producto."
              : "Agrega un producto simple al catálogo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Foto */}
          <div className="space-y-1.5">
            <Label>Foto</Label>
            {archivoParaRecortar ? (
              <ImageCropEditor
                file={archivoParaRecortar}
                onCancel={() => setArchivoParaRecortar(null)}
                onConfirm={subirImagenRecortada}
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-muted"
                >
                  {imagenUrl && (
                    <Image src={imagenUrl} alt="" fill className="object-cover" sizes="400px" />
                  )}
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-foreground/40 text-white">
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </>
            )}
          </div>

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
                autoFocus={!esEdicion}
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
            <div className={cn("grid gap-3", esDelicia ? "grid-cols-1" : "grid-cols-2")}>
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
              {!esDelicia && (
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
              )}
            </div>
            {!esDelicia && margen !== null && (
              <p className="text-xs text-muted-foreground">
                Margen:{" "}
                <span className={cn("font-semibold", margen >= 30 ? "text-success" : margen >= 10 ? "text-gold" : "text-danger")}>
                  {margen}%
                </span>
              </p>
            )}
          </div>

          {/* Inventario — solo al crear; el stock se ajusta desde la tarjeta */}
          {!esEdicion && (
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
          )}

          <DialogFooter>
            <Tooltip content={LABELS.cancelar} side="top">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip content={esEdicion ? LABELS.guardar : "Agregar producto"} side="top">
              <Button type="submit" size="icon-sm" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : esEdicion ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </Tooltip>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
