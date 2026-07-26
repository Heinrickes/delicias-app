"use client";

import { cloneElement, isValidElement, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  ShoppingCart,
  Camera,
  Loader2,
  Boxes,
  X,
} from "lucide-react";
import { CardPopover } from "@/components/shared/CardPopover";
import { UnidadSelect } from "@/components/shared/UnidadSelect";
import { ImageCropEditor } from "@/components/shared/ImageCropEditor";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  crearInsumo,
  actualizarInsumo,
  eliminarInsumo,
  ajustarStockInsumo,
  toggleEnLista,
} from "@/lib/actions/insumos";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { cn } from "@/lib/utils";
import { formatMoneda, LABELS } from "@/lib/constants";

export type Insumo = {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
  stock_minimo: number;
  costo_unitario: number;
  proveedor: string | null;
  en_lista: boolean;
  imagen_url?: string | null;
};

const EMPTY = {
  nombre: "",
  unidad: "kg",
  stock: "",
  stock_minimo: "",
  costo_unitario: "",
  proveedor: "",
};

export function InsumoFormDialog({
  trigger,
  unidadesExistentes = [],
}: {
  trigger: React.ReactNode;
  unidadesExistentes?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [modoNuevaUnidad, setModoNuevaUnidad] = useState(false);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof EMPTY, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const resetForm = () => {
    setForm(EMPTY);
    setModoNuevaUnidad(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
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
        resetForm();
        setOpen(false);
      } else toast.error(r.error);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      {isValidElement(trigger)
        ? cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
            onClick: () => setOpen(true),
          })
        : trigger}
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Agregar insumo</DialogTitle>
          <DialogDescription>
            Registra un nuevo insumo en el inventario de costos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Información principal */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Información principal
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="if-nombre">Nombre</Label>
              <Input
                id="if-nombre"
                required
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Ej: Harina"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="if-prov">Proveedor</Label>
              <Input
                id="if-prov"
                value={form.proveedor}
                onChange={(e) => set("proveedor", e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="if-unidad">Unidad</Label>
              <UnidadSelect
                id="if-unidad"
                value={form.unidad}
                onChange={(v) => set("unidad", v)}
                unidadesExistentes={unidadesExistentes}
                modoNueva={modoNuevaUnidad}
                onModoNuevaChange={setModoNuevaUnidad}
              />
            </div>
          </div>

          {/* Costo */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Costo
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="if-costo">Precio unitario</Label>
              <NumericInput
                id="if-costo"
                value={form.costo_unitario}
                onChange={(v) => set("costo_unitario", v)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Inventario */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Inventario
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="if-stock">Stock actual</Label>
                <NumericInput
                  id="if-stock"
                  step="any"
                  value={form.stock}
                  onChange={(v) => set("stock", v)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="if-min">Stock mínimo</Label>
                <NumericInput
                  id="if-min"
                  step="any"
                  value={form.stock_minimo}
                  onChange={(v) => set("stock_minimo", v)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

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
            <Tooltip content="Agregar insumo" side="top">
              <Button type="submit" size="icon-sm" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </Tooltip>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CostosManager({ insumos }: { insumos: Insumo[] }) {
  const [pending, start] = useTransition();

  const unidadesExistentes = Array.from(
    new Set(insumos.map((i) => i.unidad).filter(Boolean))
  ).sort();

  return (
    <div className="space-y-8">
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {insumos.map((i) => (
              <InsumoCard
                key={i.id}
                insumo={i}
                pending={pending}
                start={start}
                unidadesExistentes={unidadesExistentes}
              />
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
  unidadesExistentes = [],
}: {
  insumo: Insumo;
  pending: boolean;
  start: React.TransitionStartFunction;
  unidadesExistentes?: string[];
}) {
  const [open, setOpen] = useState(false);
  const agotado = insumo.stock <= 0;
  const bajo = !agotado && insumo.stock < insumo.stock_minimo;
  const pct = Math.min(100, Math.round((insumo.stock / Math.max(insumo.stock_minimo, 1)) * 100));

  const iniciales = insumo.nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

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
    <>
      <CardPopover
        imageUrl={insumo.imagen_url}
        placeholder={
          <span className="flex h-full w-full items-center justify-center bg-primary/10 text-lg font-semibold text-primary">
            {iniciales || "?"}
          </span>
        }
        badge={
          agotado ? (
            <Badge className="shrink-0 bg-danger/15 text-[10px] text-danger">Agotado</Badge>
          ) : bajo ? (
            <Badge className="shrink-0 bg-gold/15 text-[10px] text-gold">Bajo</Badge>
          ) : insumo.en_lista ? (
            <Badge className="shrink-0 bg-gold/15 text-[10px] text-gold">En lista</Badge>
          ) : (
            <Badge className="shrink-0 bg-success/15 text-[10px] text-success">OK</Badge>
          )
        }
        title={insumo.nombre}
        keyValue={
          <span className={cn("flex items-center justify-between", (agotado || bajo) && "text-danger")}>
            <span>{formatMoneda(insumo.costo_unitario)}</span>
            <span className="inline-flex items-center gap-1">
              <Boxes className="h-3 w-3" />
              {insumo.stock} {insumo.unidad}
            </span>
          </span>
        }
        fields={[
          { label: "Stock actual", value: `${insumo.stock} ${insumo.unidad}` },
          { label: "Stock mínimo", value: `${insumo.stock_minimo} ${insumo.unidad}` },
          { label: "Costo unitario", value: `${formatMoneda(insumo.costo_unitario)}/${insumo.unidad}` },
          { label: "Valor en stock", value: formatMoneda(insumo.costo_unitario * insumo.stock) },
          ...(insumo.proveedor ? [{ label: "Proveedor", value: insumo.proveedor }] : []),
        ]}
        actions={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip content={insumo.en_lista ? "Quitar de lista" : "Agregar a lista"}>
                <Button
                  type="button"
                  variant={insumo.en_lista ? "default" : "outline"}
                  size="icon-sm"
                  onClick={toggle}
                  disabled={pending}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </Tooltip>
              <Tooltip content="Gestionar">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>
            <AlertDialog>
              <Tooltip content={LABELS.eliminar}>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                />
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar insumo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará &quot;{insumo.nombre}&quot; del inventario. Esta
                    acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{LABELS.cancelar}</AlertDialogCancel>
                  <AlertDialogAction onClick={borrar}>
                    {LABELS.eliminar}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      >
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              agotado ? "bg-danger" : bajo ? "bg-gold" : "bg-success"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardPopover>

      <InsumoGestorDialog
        insumo={insumo}
        open={open}
        setOpen={setOpen}
        pending={pending}
        start={start}
        unidadesExistentes={unidadesExistentes}
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
  unidadesExistentes = [],
}: {
  insumo: Insumo;
  open: boolean;
  setOpen: (v: boolean) => void;
  pending: boolean;
  start: React.TransitionStartFunction;
  unidadesExistentes?: string[];
}) {
  const [stockVal, setStockVal] = useState(insumo.stock.toString());
  const [nombre, setNombre] = useState(insumo.nombre);
  const [unidad, setUnidad] = useState(insumo.unidad);
  const [modoNuevaUnidad, setModoNuevaUnidad] = useState(false);
  const [min, setMin] = useState(insumo.stock_minimo.toString());
  const [costo, setCosto] = useState(insumo.costo_unitario.toString());
  const [proveedor, setProveedor] = useState(insumo.proveedor ?? "");
  const [imagenUrl, setImagenUrl] = useState<string | null>(insumo.imagen_url ?? null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [archivoParaRecortar, setArchivoParaRecortar] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bajo = insumo.stock < insumo.stock_minimo;

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
    const path = `insumos/${insumo.id}/${Date.now()}.jpg`;
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

  const ajustarStock = () =>
    start(async () => {
      const r = await ajustarStockInsumo(insumo.id, parseFloat(stockVal) || 0);
      if (r.ok) toast.success("Stock actualizado");
      else toast.error(r.error);
    });

  const guardar = () =>
    start(async () => {
      const r = await actualizarInsumo(insumo.id, {
        nombre,
        unidad,
        stock_minimo: parseFloat(min) || 0,
        costo_unitario: parseInt(costo) || 0,
        proveedor,
        imagen_url: imagenUrl,
      });
      if (r.ok) {
        toast.success("Insumo actualizado");
        setOpen(false);
      } else toast.error(r.error);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{insumo.nombre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
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
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
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

          {/* Comercial */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Comercial
            </p>
            <div className="space-y-1.5">
              <Label>Costo unitario</Label>
              <NumericInput value={costo} onChange={setCosto} placeholder="0" />
            </div>
          </div>

          {/* Inventario */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Inventario
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Unidad</Label>
                <UnidadSelect
                  value={unidad}
                  onChange={setUnidad}
                  unidadesExistentes={unidadesExistentes}
                  modoNueva={modoNuevaUnidad}
                  onModoNuevaChange={setModoNuevaUnidad}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Stock mínimo</Label>
                <NumericInput step="any" value={min} onChange={setMin} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Stock actual</Label>
              <div className="flex gap-2">
                <NumericInput
                  step="any"
                  value={stockVal}
                  onChange={setStockVal}
                  className="flex-1"
                  placeholder={insumo.stock.toString()}
                />
                <Tooltip content="Guardar stock">
                  <Button onClick={ajustarStock} disabled={pending} size="icon-sm">
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                </Tooltip>
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo: {insumo.stock_minimo} {insumo.unidad} ·{" "}
                <span className={bajo ? "text-danger" : "text-success"}>
                  {bajo ? "Stock bajo" : "Suficiente"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Tooltip content={LABELS.cancelar} side="top">
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Actualizar" side="top">
            <Button onClick={guardar} disabled={pending} size="icon-sm">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
          </Tooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
