"use client";

import {
  cloneElement,
  isValidElement,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { crearPedido, type PedidoItemInput } from "@/lib/actions/pedidos";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatMoneda, LABELS } from "@/lib/constants";

type ClienteOpt = { id: string; nombre: string };
type ProductoOpt = { id: string; nombre: string; precio: number };

export function PedidoFormDialog({
  clientes,
  productos,
  trigger,
}: {
  clientes: ClienteOpt[];
  productos: ProductoOpt[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [notas, setNotas] = useState("");
  const [items, setItems] = useState<PedidoItemInput[]>([]);
  const [prodSel, setProdSel] = useState("");
  const [cantSel, setCantSel] = useState("1");
  const [isPending, startTransition] = useTransition();

  const total = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

  const reset = () => {
    setClienteId("");
    setFechaEntrega("");
    setNotas("");
    setItems([]);
    setProdSel("");
    setCantSel("1");
  };

  const agregarItem = () => {
    const prod = productos.find((p) => p.id === prodSel);
    const cant = parseInt(cantSel);
    if (!prod) {
      toast.error("Elige un producto");
      return;
    }
    if (!Number.isFinite(cant) || cant <= 0) {
      toast.error("Cantidad inválida");
      return;
    }
    setItems((prev) => {
      const existe = prev.find((i) => i.producto_id === prod.id);
      if (existe) {
        return prev.map((i) =>
          i.producto_id === prod.id
            ? { ...i, cantidad: i.cantidad + cant }
            : i
        );
      }
      return [
        ...prev,
        {
          producto_id: prod.id,
          nombre_producto: prod.nombre,
          cantidad: cant,
          precio_unitario: prod.precio,
        },
      ];
    });
    setProdSel("");
    setCantSel("1");
  };

  const quitarItem = (productoId: string | null) =>
    setItems((prev) => prev.filter((i) => i.producto_id !== productoId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    startTransition(async () => {
      const result = await crearPedido({
        cliente_id: clienteId || null,
        fecha_entrega: fechaEntrega || null,
        notas,
        items,
      });
      if (result.ok) {
        toast.success("Pedido creado");
        reset();
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      {isValidElement(trigger)
        ? cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
            onClick: () => setOpen(true),
          })
        : trigger}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo pedido</DialogTitle>
          <DialogDescription>
            Registra un encargo con su cliente y fecha de entrega.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{LABELS.cliente}</Label>
              <Select
                value={clienteId || "none"}
                onValueChange={(v) => setClienteId(!v || v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-9 w-full">
                  <span className={cn("flex-1 text-left text-sm", !clienteId && "text-muted-foreground")}>
                    {clienteId
                      ? clientes.find((c) => c.id === clienteId)?.nombre ?? "Sin cliente"
                      : "Sin cliente"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cliente</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{LABELS.fechaEntrega}</Label>
              <DatePicker
                value={fechaEntrega}
                onChange={setFechaEntrega}
                placeholder="Seleccionar fecha"
              />
            </div>
          </div>

          {/* Constructor de items */}
          <div className="space-y-2 rounded-lg border bg-background/40 p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>Producto</Label>
                <Select
                  value={prodSel || "none"}
                  onValueChange={(v) => setProdSel(!v || v === "none" ? "" : v)}
                >
                  <SelectTrigger className="h-9 w-full">
                    <span className={cn("flex-1 text-left text-sm", !prodSel && "text-muted-foreground")}>
                      {prodSel
                        ? (() => { const p = productos.find(x => x.id === prodSel); return p ? `${p.nombre} (${formatMoneda(p.precio)})` : "Elige…"; })()
                        : "Elige…"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Elige…</SelectItem>
                    {productos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} ({formatMoneda(p.precio)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20 space-y-1.5">
                <Label htmlFor="cant">Cant.</Label>
                <NumericInput
                  id="cant"
                  min="1"
                  value={cantSel}
                  onChange={setCantSel}
                />
              </div>
              <Button type="button" variant="outline" size="icon" onClick={agregarItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {items.length > 0 && (
              <ul className="divide-y rounded-md border bg-card">
                {items.map((i) => (
                  <li
                    key={i.producto_id}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-medium text-foreground">
                        {i.cantidad}×
                      </span>{" "}
                      {i.nombre_producto}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="tabular-nums text-muted-foreground">
                        {formatMoneda(i.precio_unitario * i.cantidad)}
                      </span>
                      <button
                        type="button"
                        onClick={() => quitarItem(i.producto_id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between px-1 pt-1 text-sm font-semibold">
              <span>{LABELS.total}</span>
              <span className="tabular-nums text-foreground">
                {formatMoneda(total)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notas">{LABELS.notas}</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Detalles del encargo, decoración, etc."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? LABELS.guardando : "Crear pedido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
