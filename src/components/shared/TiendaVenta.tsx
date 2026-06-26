"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Check,
  Coins,
  ClipboardList,
  UserPlus,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { crearVenta, type VentaItemInput } from "@/lib/actions/ventas";
import { crearCliente } from "@/lib/actions/clientes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatMoneda, LABELS } from "@/lib/constants";

type ComponenteItem = { producto_id: string; nombre: string; cantidad: number };
type ProductoTienda = {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string | null;
  imagen_url: string | null;
  tipo: "simple" | "delicia";
  componentes: ComponenteItem[];
};
type ClienteOpt = { id: string; nombre: string };

// Fondos decorativos provisionales (hasta tener fotos reales por producto).
const VISUALS = [
  "radial-gradient(circle at 35% 45%, #F3D9B8 0 10%, transparent 11%), radial-gradient(circle at 55% 50%, #F3D9B8 0 11%, transparent 12%), radial-gradient(circle at 72% 45%, #F3D9B8 0 10%, transparent 11%), linear-gradient(135deg, #D5B38D, #F2E5D1)",
  "radial-gradient(circle at 42% 48%, #3C2117 0 12%, #8A5A3C 13% 16%, transparent 17%), radial-gradient(circle at 60% 44%, #3C2117 0 10%, #8A5A3C 11% 15%, transparent 16%), linear-gradient(135deg, #E7D6C4, #B98C65)",
  "linear-gradient(90deg, transparent 0 12%, #E8D5B9 13% 22%, #4B2D1E 23% 31%, transparent 32% 36%, #E8D5B9 37% 47%, #4B2D1E 48% 58%, transparent 59%), linear-gradient(135deg, #D2B894, #F7E7CF)",
  "radial-gradient(circle at 35% 40%, #6D4029 0 9%, transparent 10%), radial-gradient(circle at 55% 52%, #3B2118 0 11%, transparent 12%), radial-gradient(circle at 72% 42%, #8A5A3C 0 9%, transparent 10%), linear-gradient(135deg, #EFE1D2, #B58A68)",
];

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function fechaPagoSugerida() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function TiendaVenta({
  productos,
  clientes,
}: {
  productos: ProductoTienda[];
  clientes: ClienteOpt[];
}) {
  const [items, setItems] = useState<VentaItemInput[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fase, setFase] = useState<"bolsa" | "pago">("bolsa");

  const [clienteMode, setClienteMode] = useState<"existente" | "nuevo">(
    "existente"
  );
  const [clienteId, setClienteId] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [fechaPago, setFechaPago] = useState(fechaPagoSugerida());
  const [notas, setNotas] = useState("");
  const [isPending, startTransition] = useTransition();

  const prodById = (id: string) => productos.find((p) => p.id === id);
  const enCarrito = (id: string) =>
    items.find((i) => i.producto_id === id)?.cantidad ?? 0;
  const totalUnidades = items.reduce((s, i) => s + i.cantidad, 0);
  const subtotal = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

  // Stock real del producto base (los simples llevan su stock; las delicias no).
  const stockBase = (id: string) => prodById(id)?.stock ?? 0;

  /**
   * Consumo proyectado de cada producto base por el carrito: un simple consume su
   * propio stock; una delicia consume el de cada componente (cantidad × unidades).
   * Permite simular agregar `extraQty` de `extraId` para validar antes de sumar.
   */
  const consumoBase = (extraId?: string, extraQty = 0) => {
    const m = new Map<string, number>();
    const add = (baseId: string, qty: number) =>
      m.set(baseId, (m.get(baseId) ?? 0) + qty);
    const procesar = (prodId: string, qty: number) => {
      const p = prodById(prodId);
      if (!p) return;
      if (p.tipo === "delicia") {
        for (const c of p.componentes) add(c.producto_id, c.cantidad * qty);
      } else {
        add(p.id, qty);
      }
    };
    for (const it of items) if (it.producto_id) procesar(it.producto_id, it.cantidad);
    if (extraId) procesar(extraId, extraQty);
    return m;
  };

  /** Devuelve el nombre del producto base que se agotaría, o null si hay stock. */
  const baseQueExcede = (extraId: string, extraQty: number): string | null => {
    for (const [baseId, qty] of consumoBase(extraId, extraQty)) {
      if (qty > stockBase(baseId)) return prodById(baseId)?.nombre ?? "stock";
    }
    return null;
  };

  /** Cuántas unidades más de `p` se pueden agregar según el stock base disponible. */
  const restanteAgregar = (p: ProductoTienda): number => {
    const consumido = consumoBase();
    const libre = (baseId: string) =>
      stockBase(baseId) - (consumido.get(baseId) ?? 0);
    if (p.tipo === "delicia") {
      if (p.componentes.length === 0) return 0;
      return Math.max(
        0,
        Math.min(...p.componentes.map((c) => Math.floor(libre(c.producto_id) / c.cantidad)))
      );
    }
    return Math.max(0, libre(p.id));
  };

  const reset = () => {
    setItems([]);
    setFase("bolsa");
    setClienteMode("existente");
    setClienteId("");
    setNuevoNombre("");
    setNuevoTelefono("");
    setFechaEntrega("");
    setFechaPago(fechaPagoSugerida());
    setNotas("");
  };

  const agregar = (prod: ProductoTienda) => {
    const exceso = baseQueExcede(prod.id, 1);
    if (exceso) {
      toast.error(`Sin stock suficiente de ${exceso}`);
      return;
    }
    setItems((prev) => {
      const existe = prev.find((i) => i.producto_id === prod.id);
      if (existe) {
        return prev.map((i) =>
          i.producto_id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          producto_id: prod.id,
          nombre_producto: prod.nombre,
          cantidad: 1,
          precio_unitario: prod.precio,
        },
      ];
    });
    setFase("bolsa");
    setDrawerOpen(true);
  };

  const setCantidad = (id: string, next: number) => {
    if (next <= 0) {
      setItems((prev) => prev.filter((i) => i.producto_id !== id));
      return;
    }
    const delta = next - enCarrito(id);
    if (delta > 0) {
      const exceso = baseQueExcede(id, delta);
      if (exceso) {
        toast.error(`Sin stock suficiente de ${exceso}`);
        return;
      }
    }
    setItems((prev) =>
      prev.map((i) => (i.producto_id === id ? { ...i, cantidad: next } : i))
    );
  };

  const confirmar = (estado: "entregado" | "por_cobrar" | "pendiente") => {
    if (items.length === 0) {
      toast.error("La bolsa está vacía");
      return;
    }
    startTransition(async () => {
      let cliente_id: string | null = clienteId || null;
      if (clienteMode === "nuevo" && nuevoNombre.trim()) {
        const cli = await crearCliente({
          nombre: nuevoNombre,
          telefono: nuevoTelefono,
        });
        if (!cli.ok || !cli.data) {
          toast.error(cli.ok ? "No se pudo crear el cliente" : cli.error);
          return;
        }
        cliente_id = cli.data.id;
      }

      const result = await crearVenta({
        cliente_id,
        fecha_entrega: fechaEntrega || null,
        notas,
        estado,
        fecha_estimada_pago: estado === "por_cobrar" ? fechaPago : null,
        items,
      });

      if (result.ok) {
        const msg = {
          entregado: "Venta registrada · stock actualizado",
          por_cobrar: "Entregado · pendiente de cobro",
          pendiente: "Encargo guardado",
        }[estado];
        toast.success(msg);
        reset();
        setDrawerOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      {/* Barra de catálogo con acceso a la bolsa */}
      <div className="sticky top-0 z-20 -mx-1 mb-5 flex items-center justify-between gap-3 bg-surface/95 px-1 py-2 backdrop-blur">
        <p className="text-sm text-muted-foreground">
          {productos.length} {productos.length === 1 ? "producto" : "productos"}
        </p>
        <Button onClick={() => setDrawerOpen(true)} className="relative">
          <ShoppingBag className="h-4 w-4" />
          Tu bolsa
          {totalUnidades > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-foreground px-1.5 text-xs font-bold text-primary">
              {totalUnidades}
            </span>
          )}
        </Button>
      </div>

      {/* Catálogo */}
      {productos.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">
          No hay productos disponibles. Agrégalos en Productos.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {productos.map((p, idx) => {
            const restante = restanteAgregar(p);
            const agotado = p.stock <= 0;
            const sinMas = restante <= 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => agregar(p)}
                disabled={sinMas}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-lg bg-card text-left ring-1 ring-foreground/10 transition-shadow",
                  sinMas
                    ? "cursor-not-allowed opacity-60"
                    : "hover:shadow-[0_14px_34px_rgba(75,45,30,0.08)]"
                )}
              >
                <div
                  className="relative h-20 bg-cover bg-center sm:h-24"
                  style={p.imagen_url ? undefined : { background: VISUALS[idx % VISUALS.length] }}
                >
                  {p.imagen_url && (
                    <Image
                      src={p.imagen_url}
                      alt={p.nombre}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  )}
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    {p.tipo === "delicia" && (
                      <Badge className="bg-primary text-primary-foreground">
                        Delicia
                      </Badge>
                    )}
                    {agotado && (
                      <Badge className="bg-danger/90 text-white">Agotado</Badge>
                    )}
                  </div>
                  {!sinMas && (
                    <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                      <Plus className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-2.5">
                  {p.categoria && (
                    <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {p.categoria}
                    </span>
                  )}
                  <h3 className="mt-0.5 line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
                    {p.nombre}
                  </h3>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatMoneda(p.precio)}
                    </span>
                    <span
                      className={cn(
                        "text-[11px]",
                        restante <= 0
                          ? "text-danger"
                          : restante <= 5
                            ? "text-gold"
                            : "text-muted-foreground"
                      )}
                    >
                      {agotado ? "Agotado" : `${restante} disp`}
                    </span>
                  </div>
                </div>
              </button>
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

      {/* Drawer: Tu bolsa
          Móvil  → bottom sheet (h-[62vh], sube desde abajo)
          Desktop → panel lateral derecho (ancho fijo, cubre toda la altura) */}
      <aside
        className={cn(
          "fixed z-50 flex flex-col bg-card shadow-2xl transition-transform duration-300",
          // Mobile: bottom sheet (empieza encima de la nav bar de 3.75rem)
          "bottom-[3.75rem] left-0 right-0 h-[62vh] rounded-t-2xl",
          // Desktop: side panel
          "lg:bottom-auto lg:inset-y-0 lg:left-auto lg:h-auto lg:max-h-none lg:w-full lg:max-w-md lg:rounded-none",
          // Animación
          drawerOpen
            ? "translate-y-0 lg:translate-x-0"
            : "translate-y-full lg:translate-y-0 lg:translate-x-full"
        )}
      >
        {/* Handle visual: solo en móvil */}
        <div className="flex justify-center pb-1 pt-2.5 lg:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="h-1 w-10 rounded-full bg-foreground/20" />
        </div>

        <header className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            {fase === "pago" && (
              <button
                type="button"
                onClick={() => setFase("bolsa")}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Volver a la bolsa"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-foreground">
              {fase === "bolsa" ? "Tu bolsa" : "Cerrar venta"}
            </h2>
            {fase === "bolsa" && totalUnidades > 0 && (
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
            <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Tu bolsa está vacía</p>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Seguir agregando
            </Button>
          </div>
        ) : fase === "bolsa" ? (
          <>
            <div className="flex-1 divide-y overflow-y-auto px-5">
              {items.map((i) => (
                <div key={i.producto_id} className="flex gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {i.nombre_producto}
                    </p>
                    <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
                      {formatMoneda(i.precio_unitario)}
                    </p>
                    <div className="mt-2 inline-flex items-center rounded-lg border">
                      <button
                        type="button"
                        onClick={() => setCantidad(i.producto_id!, i.cantidad - 1)}
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
                          if (Number.isFinite(n))
                            setCantidad(i.producto_id!, n);
                        }}
                        className="h-8 w-12 border-x bg-transparent text-center text-sm tabular-nums outline-none focus:bg-background/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        aria-label="Cantidad"
                      />
                      <button
                        type="button"
                        onClick={() => setCantidad(i.producto_id!, i.cantidad + 1)}
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
                      onClick={() => setCantidad(i.producto_id!, 0)}
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
                <span className="text-sm text-muted-foreground">
                  {LABELS.total}
                </span>
                <span className="text-xl font-semibold tabular-nums text-foreground">
                  {formatMoneda(subtotal)}
                </span>
              </div>
              <Button
                className="mt-4 w-full"
                size="lg"
                onClick={() => setFase("pago")}
              >
                Continuar
              </Button>
            </footer>
          </>
        ) : (
          /* Fase de pago / desenlace */
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <div className="rounded-lg bg-background/50 px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {totalUnidades} {totalUnidades === 1 ? "producto" : "productos"}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatMoneda(subtotal)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>{LABELS.cliente}</Label>
                  <button
                    type="button"
                    onClick={() =>
                      setClienteMode((m) =>
                        m === "nuevo" ? "existente" : "nuevo"
                      )
                    }
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {clienteMode === "nuevo" ? (
                      <>
                        <X className="h-3 w-3" /> Elegir existente
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3" /> Nuevo cliente
                      </>
                    )}
                  </button>
                </div>
                {clienteMode === "existente" ? (
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Sin cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      placeholder="Nombre del cliente"
                    />
                    <Input
                      value={nuevoTelefono}
                      onChange={(e) => setNuevoTelefono(e.target.value)}
                      placeholder="Teléfono (opcional)"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-fecha">{LABELS.fechaEntrega} (opcional)</Label>
                <Input
                  id="t-fecha"
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-notas">{LABELS.notas}</Label>
                <Textarea
                  id="t-notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Detalles, decoración, etc."
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-pago">Fecha estimada de pago (si queda por cobrar)</Label>
                <Input
                  id="t-pago"
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                />
              </div>
            </div>

            <footer className="space-y-2 border-t px-5 py-4">
              <Button
                className="w-full"
                size="lg"
                disabled={isPending}
                onClick={() => confirmar("entregado")}
              >
                <Check className="h-4 w-4" />
                Entregado y pagado · {formatMoneda(subtotal)}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => confirmar("por_cobrar")}
                >
                  <Coins className="h-4 w-4" />
                  Por cobrar
                </Button>
                <Button
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => confirmar("pendiente")}
                >
                  <ClipboardList className="h-4 w-4" />
                  Encargo
                </Button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
