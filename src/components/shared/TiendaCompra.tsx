"use client";

import { useState, useTransition, useRef } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { formatMoneda, LABELS } from "@/lib/constants";

export type InsumoTienda = {
  id: string;
  nombre: string;
  unidad: string;
  costo_unitario: number;
  en_lista: boolean;
  stock: number;
  stock_minimo: number;
};

type ItemCarrito = CompraItem & { precio_str: string };

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
  const getItemsIniciales = (): ItemCarrito[] =>
    insumos
      .filter((i) => i.en_lista)
      .map((i) => ({
        insumo_id: i.id,
        nombre: i.nombre,
        cantidad: 1,
        precio_unitario: i.costo_unitario,
        precio_str: i.costo_unitario > 0 ? i.costo_unitario.toString() : "",
      }));

  const [items, setItems] = useState<ItemCarrito[]>(getItemsIniciales);
  const [_drawerOpen, _setDrawerOpen] = useState(false);
  const drawerOpen = isControlled ? openProp! : _drawerOpen;
  const setDrawerOpen = isControlled ? onOpenChange! : _setDrawerOpen;
  const [fase, setFase] = useState<"compra" | "confirmar">("compra");
  const [proveedor, setProveedor] = useState("");
  const [notas, setNotas] = useState("");
  const [planDate, setPlanDate] = useState(ymdHoy());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPending, startTransition] = useTransition();

  const touchStartY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const onDragStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onDragMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setDragOffset(delta);
  };
  const onDragEnd = () => {
    if (dragOffset > 80) setDrawerOpen(false);
    setDragOffset(0);
  };

  const totalUnidades = items.reduce((s, i) => s + i.cantidad, 0);
  const subtotal = items.reduce(
    (s, i) => s + i.precio_unitario * i.cantidad,
    0
  );

  const enCarrito = (id: string) =>
    items.find((i) => i.insumo_id === id)?.cantidad ?? 0;

  const reset = () => {
    setItems(getItemsIniciales());
    setFase("compra");
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
          precio_str:
            ins.costo_unitario > 0 ? ins.costo_unitario.toString() : "",
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
      const r = await crearCompra(items, subtotal, proveedor, notas);
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
      const r = await planificarCompra(items, subtotal, planDate, proveedor, notas);
      if (r.ok) {
        toast.success("Compra planificada · aparecerá en el Calendario");
        reset();
        setDrawerOpen(false);
      } else {
        toast.error(r.error);
      }
    });
  };

  return (
    <>
      {/* Barra sticky con acceso al carrito */}
      <div className="sticky top-0 z-20 -mx-1 mb-5 flex items-center justify-between gap-2 bg-surface/95 px-1 py-2 backdrop-blur">
        <p className="text-sm text-muted-foreground">
          {insumos.length} {insumos.length === 1 ? "insumo" : "insumos"}
        </p>
        {!isControlled && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-primary/10"
          >
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              <ShoppingCart className="h-6 w-6" />
              {totalUnidades > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {totalUnidades}
                </span>
              )}
            </span>
            <span className="text-[11px] font-semibold text-primary">Tu compra</span>
          </button>
        )}
      </div>

      {/* Catálogo de insumos */}
      {insumos.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">
          No hay insumos. Agrégalos en Costos.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {insumos.map((ins) => {
            const cantActual = enCarrito(ins.id);
            const agotado = ins.stock <= 0;
            const bajo = ins.stock < ins.stock_minimo;
            return (
              <div
                key={ins.id}
                className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
              >
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {ins.nombre}
                    </p>
                    {ins.en_lista && (
                      <span className="shrink-0 rounded-full bg-terracotta/15 px-1.5 py-0.5 text-[10px] font-semibold text-terracotta">
                        En lista
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ins.stock} {ins.unidad} · {formatMoneda(ins.costo_unitario)}/{ins.unidad}
                    {agotado ? (
                      <span className="ml-1 text-danger">· Agotado</span>
                    ) : bajo ? (
                      <span className="ml-1 text-gold">· Stock bajo</span>
                    ) : null}
                  </p>
                </div>

                {/* Botón agregar / controles de cantidad */}
                {cantActual > 0 ? (
                  <div className="inline-flex items-center rounded-lg border">
                    <button
                      type="button"
                      onClick={() => setCantidad(ins.id, cantActual - 1)}
                      className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label="Quitar uno"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={cantActual}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") return;
                        const n = parseInt(v, 10);
                        if (Number.isFinite(n)) setCantidad(ins.id, n);
                      }}
                      className="h-8 w-12 border-x bg-transparent text-center text-sm tabular-nums outline-none focus:bg-background/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      aria-label="Cantidad"
                    />
                    <button
                      type="button"
                      onClick={() => setCantidad(ins.id, cantActual + 1)}
                      className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label="Agregar uno"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => agregar(ins)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    aria-label="Agregar"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 transition-opacity lg:bg-foreground/40 lg:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Drawer: Tu compra */}
      <aside
        className={cn(
          "fixed z-50 flex flex-col bg-card shadow-2xl duration-300",
          dragOffset === 0 && "transition-[transform,height]",
          "bottom-[3.75rem] left-0 right-0 rounded-t-2xl",
          fase === "confirmar" ? "h-[calc(100vh-3.75rem)]" : "h-[62vh]",
          "lg:bottom-auto lg:inset-y-0 lg:left-auto lg:h-auto lg:max-h-none lg:w-full lg:max-w-md lg:rounded-none",
          drawerOpen
            ? "translate-y-0 lg:translate-x-0"
            : "translate-y-full lg:translate-y-0 lg:translate-x-full"
        )}
        style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined}
      >
        {/* Zona de arrastre */}
        <div
          className="touch-none select-none"
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
        >
          <div className="flex justify-center pb-2 pt-3 lg:hidden">
            <div className="h-1 w-10 rounded-full bg-foreground/20" />
          </div>

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
                {fase === "compra" ? "Tu compra" : "Confirmar compra"}
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
        </div>

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
                <div key={i.insumo_id} className="flex gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {i.nombre}
                    </p>
                    {/* Precio editable inline */}
                    <div className="mt-1 flex items-center gap-1">
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
                    <div className="mt-2 inline-flex items-center rounded-lg border">
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
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      onClick={() => setCantidad(i.insumo_id, 0)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Eliminar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatMoneda(i.precio_unitario * i.cantidad)}
                    </span>
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
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-3xl font-bold tabular-nums text-foreground">
                  {formatMoneda(subtotal)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={comprarAhora}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-success/10 disabled:opacity-50"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-white shadow">
                    <Check className="h-6 w-6" />
                  </span>
                  <span className="text-center text-[11px] font-semibold leading-tight text-success">
                    Comprar ahora
                  </span>
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={planificar}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-primary/10 disabled:opacity-50"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    <CalendarDays className="h-6 w-6" />
                  </span>
                  <span className="text-center text-[11px] font-semibold leading-tight text-primary">
                    {showDatePicker ? "Confirmar fecha" : "Planificar"}
                  </span>
                </button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
