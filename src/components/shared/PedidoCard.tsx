"use client";

import { useState, useTransition } from "react";
import { Trash2, User, Check, Coins, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { cambiarEstadoPedido, eliminarPedido } from "@/lib/actions/pedidos";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { CardPopover } from "@/components/shared/CardPopover";
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
import {
  ESTADOS_PEDIDO,
  formatMoneda,
  LABELS,
  LOCALE,
  type EstadoPedido,
} from "@/lib/constants";

type PedidoItem = {
  nombre_producto: string;
  cantidad: number;
  subtotal: number;
};

type Pedido = {
  id: string;
  fecha_entrega: string | null;
  fecha_estimada_pago: string | null;
  estado: string;
  total: number;
  notas: string | null;
  cliente: string | null;
  items: PedidoItem[];
};

const estadoBadgeClasses: Record<EstadoPedido, string> = {
  pendiente: "bg-gold/15 text-gold",
  por_cobrar: "bg-terracotta/15 text-terracotta",
  entregado: "bg-success/15 text-success",
  cancelado: "bg-danger/15 text-danger",
};

function fmtFecha(d: string | null) {
  if (!d) return "Sin fecha";
  return new Date(d + "T00:00:00").toLocaleDateString(LOCALE, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function hoyISO() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function PedidoCard({ pedido }: { pedido: Pedido }) {
  const [pending, startTransition] = useTransition();
  const [cobrarOpen, setCobrarOpen] = useState(false);
  const [pagoOpen, setPagoOpen] = useState(false);
  const [fechaPago, setFechaPago] = useState(hoyISO());
  const [modoPago, setModoPago] = useState<"efectivo" | "transferencia">("efectivo");
  const estado = pedido.estado as EstadoPedido;

  const cambiar = (nuevo: EstadoPedido, fecha?: string, modo?: "efectivo" | "transferencia") => {
    startTransition(async () => {
      const result = await cambiarEstadoPedido(pedido.id, nuevo, fecha, modo);
      if (result.ok) {
        const msg: Record<EstadoPedido, string> = {
          entregado:
            estado === "por_cobrar"
              ? "Pago registrado"
              : "Entregado y pagado · venta y stock actualizados",
          por_cobrar: "Entregado · pendiente de cobro",
          cancelado: "Pedido cancelado",
          pendiente: "Pedido reabierto",
        };
        toast.success(msg[nuevo]);
        setCobrarOpen(false);
        setPagoOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleBorrar = () => {
    startTransition(async () => {
      const result = await eliminarPedido(pedido.id);
      if (result.ok) toast.success("Pedido eliminado");
      else toast.error(result.error);
    });
  };

  const pagoVencido =
    estado === "por_cobrar" &&
    pedido.fecha_estimada_pago !== null &&
    new Date(pedido.fecha_estimada_pago + "T23:59:59") < new Date();

  return (
    <>
      <CardPopover
        layout="row"
        imageUrl={null}
        placeholder={<User className="h-5 w-5 text-muted-foreground" />}
        badge={
          <Badge className={cn("shrink-0 text-[10px]", estadoBadgeClasses[estado] ?? "bg-muted")}>
            {ESTADOS_PEDIDO[estado] ?? pedido.estado}
          </Badge>
        }
        title={pedido.cliente ?? "Sin cliente"}
        keyValue={`${fmtFecha(pedido.fecha_entrega)} · ${formatMoneda(pedido.total)}`}
        fields={[
          { label: "Total", value: formatMoneda(pedido.total) },
          { label: "Estado", value: ESTADOS_PEDIDO[estado] ?? pedido.estado },
          ...(estado === "por_cobrar" && pedido.fecha_estimada_pago
            ? [{ label: "Fecha cobro", value: fmtFecha(pedido.fecha_estimada_pago) }]
            : []),
        ]}
        actions={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {estado === "pendiente" && (
                <>
                  <Tooltip content="Cobrar">
                    <Button
                      size="icon-sm"
                      disabled={pending}
                      onClick={() => setPagoOpen(true)}
                      className="bg-success text-white hover:bg-success/90"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Por cobrar">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => setCobrarOpen(true)}
                      className="text-terracotta"
                    >
                      <Coins className="h-3.5 w-3.5" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Cancelar pedido">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => cambiar("cancelado")}
                      className="text-muted-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </Tooltip>
                </>
              )}
              {estado === "por_cobrar" && (
                <Tooltip content="Pagado">
                  <Button
                    size="icon-sm"
                    disabled={pending}
                    onClick={() => setPagoOpen(true)}
                    className="bg-success text-white hover:bg-success/90"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
              )}
            </div>
            <AlertDialog>
              <Tooltip content={LABELS.eliminar}>
                <AlertDialogTrigger
                  render={
                    <Button
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
                  <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará el pedido y sus productos. Esta acción no se puede
                    deshacer.
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
        {(pedido.items.length > 0 || pedido.notas || pagoVencido) && (
          <div className="mt-3 space-y-1 border-t pt-3">
            {pagoVencido && (
              <p className="text-xs font-semibold text-danger">Pago vencido</p>
            )}
            <ul className="space-y-0.5">
              {pedido.items.map((it, idx) => (
                <li key={idx} className="truncate text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{it.cantidad}×</span>{" "}
                  {it.nombre_producto}
                </li>
              ))}
            </ul>
            {pedido.notas && (
              <p className="truncate text-[11px] italic text-muted-foreground">
                {pedido.notas}
              </p>
            )}
          </div>
        )}
      </CardPopover>

      {/* Diálogo por cobrar */}
      <Dialog open={cobrarOpen} onOpenChange={setCobrarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entregar por cobrar</DialogTitle>
            <DialogDescription>
              Se descuenta el stock y se registra la venta, pero queda pendiente
              de pago.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Fecha estimada de pago</Label>
            <DatePicker
              value={fechaPago}
              onChange={setFechaPago}
              placeholder="Seleccionar fecha"
            />
          </div>
          <DialogFooter>
            <Tooltip content="Confirmar entrega">
              <Button
                size="icon-sm"
                disabled={pending}
                onClick={() => cambiar("por_cobrar", fechaPago)}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </Tooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de pago */}
      <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar pago</DialogTitle>
            <DialogDescription>
              {estado === "pendiente"
                ? "Se descuenta el stock y se registra la venta como pagada."
                : "Se marca este pedido como pagado."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Modo de pago</Label>
            <Select
              value={modoPago}
              onValueChange={(v) => setModoPago((v as "efectivo" | "transferencia") ?? "efectivo")}
            >
              <SelectTrigger className="h-9 w-full">
                <span className="flex-1 text-left text-sm capitalize">{modoPago}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Tooltip content="Confirmar pago">
              <Button
                size="icon-sm"
                disabled={pending}
                onClick={() => cambiar("entregado", undefined, modoPago)}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </Tooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
