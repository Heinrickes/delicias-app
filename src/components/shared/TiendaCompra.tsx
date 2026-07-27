"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Check,
  CalendarDays,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  crearCompra,
  planificarCompra,
  type CompraItem,
} from "@/lib/actions/compras";
import { ActionButton } from "@/components/shared/ActionButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Drawer,
  DrawerPortal,
  DrawerBackdrop,
  DrawerViewport,
  DrawerContent,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { formatMoneda, LABELS } from "@/lib/constants";

export type InsumoTienda = {
  id: string;
  nombre: string;
  unidad: string;
  costo_unitario: number;
  stock: number;
  stock_minimo: number;
  imagen_url: string | null;
};

type ItemCarrito = CompraItem & { precio_str: string };

// Fondos decorativos provisionales (hasta tener fotos reales).
const VISUALS = [
  "radial-gradient(circle at 35% 45%, #F3D9B8 0 10%, transparent 11%), radial-gradient(circle at 55% 50%, #F3D9B8 0 11%, transparent 12%), radial-gradient(circle at 72% 45%, #F3D9B8 0 10%, transparent 11%), linear-gradient(135deg, #D5B38D, #F2E5D1)",
  "radial-gradient(circle at 42% 48%, #3C2117 0 12%, #8A5A3C 13% 16%, transparent 17%), radial-gradient(circle at 60% 44%, #3C2117 0 10%, #8A5A3C 11% 15%, transparent 16%), linear-gradient(135deg, #E7D6C4, #B98C65)",
  "linear-gradient(90deg, transparent 0 12%, #E8D5B9 13% 22%, #4B2D1E 23% 31%, transparent 32% 36%, #E8D5B9 37% 47%, #4B2D1E 48% 58%, transparent 59%), linear-gradient(135deg, #D2B894, #F7E7CF)",
  "radial-gradient(circle at 35% 40%, #6D4029 0 9%, transparent 10%), radial-gradient(circle at 55% 52%, #3B2118 0 11%, transparent 12%), radial-gradient(circle at 72% 42%, #8A5A3C 0 9%, transparent 10%), linear-gradient(135deg, #EFE1D2, #B58A68)",
];

function ymdHoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TiendaCompra({
  insumos,
  open: openProp,
  onOpenChange,
}: {
  insumos: InsumoTienda[];
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const isControlled = openProp !== undefined;

  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [_drawerOpen, _setDrawerOpen] = useState(false);
  const drawerOpen = isControlled ? openProp! : _drawerOpen;
  const setDrawerOpen = isControlled ? onOpenChange! : _setDrawerOpen;
  const [fase, setFase] = useState<"compra" | "confirmar">("compra");
  const [nombre, setNombre] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [notas, setNotas] = useState("");
  const [planDate, setPlanDate] = useState(ymdHoy());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalUnidades = items.reduce((s, i) => s + i.cantidad, 0);
  const subtotal = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

  const enCarrito = (id: string) => items.find((i) => i.insumo_id === id)?.cantidad ?? 0;

  const reset = () => {
    setItems([]);
    setFase("compra");
    setNombre("");
    setProveedor("");
    setNotas("");
    setPlanDate(ymdHoy());
    setShowDatePicker(false);
  };

  const agregar = (ins: InsumoTienda) => {
    setItems((prev) => {
      const existe = prev.find((i) => i.insumo_id === ins.id);
      if (existe) {
        return prev.map((i) =>
          i.insumo_id === ins.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          insumo_id: ins.id,
          nombre: ins.nombre,
          cantidad: 1,
          precio_unitario: ins.costo_unitario,
          precio_str: ins.costo_unitario > 0 ? ins.costo_unitario.toString() : "",
        },
      ];
    });
    setFase("compra");
    setDrawerOpen(true);
  };

  const setCantidad = (id: string, next: number) => {
    if (next <= 0) {
      setItems((prev) => prev.filter((i) => i.insumo_id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.insumo_id === id ? { ...i, cantidad: next } : i))
    );
  };

  const setPrecio = (id: string, raw: string) => {
    const num = parseFloat(raw.replace(",", "."));
    setItems((prev) =>
      prev.map((i) =>
        i.insumo_id === id
          ? {
              ...i,
              precio_str: raw,
              precio_unitario: Number.isFinite(num) && num >= 0 ? num : i.precio_unitario,
            }
          : i
      )
    );
  };

  const comprarAhora = () => {
    if (!items.length) { toast.error("La lista está vacía"); return; }
    startTransition(async () => {
      const r = await crearCompra(items, subtotal, proveedor, notas, nombre);
      if (r.ok) {
        toast.success("Compra registrada · stock actualizado");
        reset();
        setDrawerOpen(false);
      } else {
        toast.error(r.error);
      }
    });
  };

  const planificar = () => {
    if (!items.length) { toast.error("La lista está vacía"); return; }
    if (!showDatePicker) {
      setShowDatePicker(true);
      return;
    }
    startTransition(async () => {
      const r = await planificarCompra(items, subtotal, planDate, proveedor, notas, nombre);
      if (r.ok) {
        toast.success("Lista guardada · aparece en Mis listas");
        reset();
        setDrawerOpen(false);
      } else {
        toast.error(r.error);
      }
    });
  };

  const sheetBody = (
    <>
      <header className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          {fase === "confirmar" && (
            <button
              type="button"
              onClick={() => setFase("compra")}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="text-lg font-semibold text-foreground">
            {fase === "compra" ? "Tu compra" : "Guardar lista"}
          </h2>
          {fase === "compra" && totalUnidades > 0 && (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
              {totalUnidades}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <ShoppingCart className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">La lista está vacía</p>
          <Button variant="outline" onClick={() => setDrawerOpen(false)}>
            Agregar insumos
          </Button>
        </div>
      ) : fase === "compra" ? (
        <>
          <div className="flex-1 divide-y overflow-y-auto overscroll-contain touch-pan-y px-5">
            {items.map((i) => (
              <div key={i.insumo_id} className="py-4">
                <p className="truncate text-sm font-medium text-foreground">
                  {i.nombre}
                </p>
                <div className="mt-2 grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-3 gap-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={i.precio_str}
                      onChange={(e) => setPrecio(i.insumo_id, e.target.value)}
                      placeholder="0"
                      className="w-20 rounded border border-foreground/15 bg-transparent px-1.5 py-0.5 text-sm tabular-nums text-muted-foreground outline-none focus:border-primary focus:text-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      aria-label="Precio unitario"
                    />
                  </div>
                  <div className="inline-flex items-center rounded-lg border">
                    <button
                      type="button"
                      onClick={() => setCantidad(i.insumo_id, i.cantidad - 1)}
                      className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label="Quitar uno"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={i.cantidad}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") return;
                        const n = parseInt(v, 10);
                        if (Number.isFinite(n)) setCantidad(i.insumo_id, n);
                      }}
                      className="h-8 w-12 border-x bg-transparent text-center text-sm tabular-nums outline-none focus:bg-background/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      aria-label="Cantidad"
                    />
                    <button
                      type="button"
                      onClick={() => setCantidad(i.insumo_id, i.cantidad + 1)}
                      className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label="Agregar uno"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span />
                  <div className="flex items-center gap-2 justify-self-end">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatMoneda(i.precio_unitario * i.cantidad)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCantidad(i.insumo_id, 0)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Eliminar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <footer className="border-t px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{LABELS.total}</p>
                <p className="text-xl font-semibold tabular-nums text-foreground">
                  {formatMoneda(subtotal)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFase("confirmar")}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
                aria-label="Confirmar compra"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </footer>
        </>
      ) : (
        /* Fase confirmar */
        <>
          <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain touch-pan-y px-5 py-4">
            <div className="rounded-lg bg-background/50 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {items.length} {items.length === 1 ? "insumo" : "insumos"} · {totalUnidades} unidades
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatMoneda(subtotal)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tc-nombre">Nombre de la lista</Label>
              <Input
                id="tc-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Compra semanal, Reposición ingredientes…"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tc-prov">Proveedor (opcional)</Label>
              <Input
                id="tc-prov"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Nombre del local o proveedor"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tc-notas">{LABELS.notas}</Label>
              <Textarea
                id="tc-notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Marcas específicas, detalles..."
                rows={2}
              />
            </div>

            {showDatePicker && (
              <div className="space-y-1.5">
                <Label>Fecha planificada</Label>
                <DatePicker
                  value={planDate}
                  onChange={setPlanDate}
                  placeholder="Seleccionar fecha"
                />
              </div>
            )}
          </div>

          <footer className="border-t px-5 pb-6 pt-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total estimado</span>
              <span className="text-3xl font-bold tabular-nums text-foreground">
                {formatMoneda(subtotal)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ActionButton
                icon={<Check className="h-6 w-6" />}
                label="Comprar ahora"
                color="success"
                disabled={isPending}
                onClick={comprarAhora}
              />
              <ActionButton
                icon={<CalendarDays className="h-6 w-6" />}
                label={showDatePicker ? "Confirmar fecha" : "Planificar"}
                color="primary"
                disabled={isPending}
                onClick={planificar}
              />
            </div>
          </footer>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Barra sticky (solo cuando no hay control externo) */}
      {!isControlled && (
        <div className="sticky top-0 z-20 -mx-1 mb-5 flex items-center justify-between gap-2 bg-surface/95 px-1 py-2 backdrop-blur">
          <p className="text-sm text-muted-foreground">
            {insumos.length} {insumos.length === 1 ? "insumo" : "insumos"}
          </p>
          <ActionButton
            icon={<ShoppingCart className="h-6 w-6" />}
            label="Tu compra"
            color="primary"
            badge={totalUnidades}
            onClick={() => setDrawerOpen(true)}
          />
        </div>
      )}

      {/* Catálogo — grid de tarjetas igual que Ventas */}
      {insumos.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">
          No hay insumos. Agrégalos con el botón "Agregar insumo".
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {insumos.map((ins, idx) => {
            const cantActual = enCarrito(ins.id);
            const agotado = ins.stock <= 0;
            const bajo = ins.stock < ins.stock_minimo && !agotado;
            return (
              <button
                key={ins.id}
                type="button"
                onClick={() => agregar(ins)}
                className="group flex flex-col overflow-hidden rounded-lg bg-card text-left ring-1 ring-foreground/10 transition-shadow hover:shadow-[0_14px_34px_rgba(75,45,30,0.08)]"
              >
                {/* Visual / imagen */}
                <div
                  className="relative h-20 bg-cover bg-center sm:h-24"
                  style={ins.imagen_url ? undefined : { background: VISUALS[idx % VISUALS.length] }}
                >
                  {ins.imagen_url && (
                    <Image
                      src={ins.imagen_url}
                      alt={ins.nombre}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  )}
                  {/* Badges top-left */}
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    {agotado && (
                      <span className="rounded-full bg-danger/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        Agotado
                      </span>
                    )}
                    {bajo && (
                      <span className="rounded-full bg-gold/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        Stock bajo
                      </span>
                    )}
                  </div>
                  {/* Badge cantidad en carrito (bottom-right) */}
                  {cantActual > 0 && (
                    <span className="absolute bottom-2 right-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-terracotta px-1.5 text-[11px] font-bold text-white shadow">
                      {cantActual}
                    </span>
                  )}
                </div>
                {/* Info */}
                <div className="flex flex-1 flex-col p-2.5">
                  <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {ins.unidad}
                  </span>
                  <h3 className="mt-0.5 line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
                    {ins.nombre}
                  </h3>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatMoneda(ins.costo_unitario)}
                    </span>
                    <span
                      className={cn(
                        "text-[11px]",
                        agotado ? "text-danger" : bajo ? "text-gold" : "text-muted-foreground"
                      )}
                    >
                      {ins.stock} {ins.unidad}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Móvil: sheet inferior (Base UI Drawer) — deslizar hacia abajo para cerrar */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerPortal>
          <DrawerBackdrop className="lg:hidden" />
          <DrawerViewport className="lg:hidden">
            <DrawerContent>{sheetBody}</DrawerContent>
          </DrawerViewport>
        </DrawerPortal>
      </Drawer>

      {/* Desktop: panel lateral fijo */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 hidden w-full max-w-md flex-col bg-card shadow-2xl transition-transform duration-300 lg:flex",
          drawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {sheetBody}
      </aside>
    </>
  );
}
