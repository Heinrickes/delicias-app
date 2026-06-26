"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Trash2, User, Check, Coins, X } from "lucide-react";
import { toast } from "sonner";
import { cambiarEstadoPedido, eliminarPedido } from "@/lib/actions/pedidos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
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

const estadoBadge: Record<EstadoPedido, string> = {
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
  d.setDate(d.getDate() + 7); // sugerencia: 7 días
  return d.toISOString().slice(0, 10);
}

export function PedidoCard({ pedido }: { pedido: Pedido }) {
  const [pending, startTransition] = useTransition();
  const [cobrarOpen, setCobrarOpen] = useState(false);
  const [fechaPago, setFechaPago] = useState(hoyISO());
  const estado = pedido.estado as EstadoPedido;

  const cambiar = (nuevo: EstadoPedido, fecha?: string) => {
    startTransition(async () => {
      const result = await cambiarEstadoPedido(pedido.id, nuevo, fecha);
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
    <div className="flex flex-col rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <User className="h-3.5 w-3.5 text-gold" />
            {pedido.cliente ?? "Sin cliente"}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            Entrega: {fmtFecha(pedido.fecha_entrega)}
          </p>
        </div>
        <Badge className={estadoBadge[estado] ?? "bg-muted"}>
          {ESTADOS_PEDIDO[estado] ?? pedido.estado}
        </Badge>
      </div>

      <ul className="mt-4 space-y-1.5 border-t pt-3 text-sm">
        {pedido.items.map((it, idx) => (
          <li key={idx} className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-muted-foreground">
              <span className="font-medium text-foreground">{it.cantidad}×</span>{" "}
              {it.nombre_producto}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatMoneda(it.subtotal)}
            </span>
          </li>
        ))}
      </ul>

      {pedido.notas && (
        <p className="mt-3 rounded-md bg-background/50 px-3 py-2 text-xs italic text-muted-foreground">
          {pedido.notas}
        </p>
      )}

      {estado === "por_cobrar" && (
        <p
          className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${
            pagoVencido ? "text-danger" : "text-terracotta"
          }`}
        >
          <Coins className="h-3.5 w-3.5" />
          Pago estimado: {fmtFecha(pedido.fecha_estimada_pago)}
          {pagoVencido && " · vencido"}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">{LABELS.total}</span>
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {formatMoneda(pedido.total)}
        </span>
      </div>

      {/* Acciones según estado */}
      <div className="mt-4 flex items-end justify-between border-t pt-3">
        <div className="flex gap-4">
          {estado === "pendiente" && (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => cambiar("entregado")}
                className="flex flex-col items-center gap-1 disabled:opacity-50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success text-white shadow-sm">
                  <Check className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-semibold text-success">Cobrar</span>
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setCobrarOpen(true)}
                className="flex flex-col items-center gap-1 disabled:opacity-50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-terracotta text-white shadow-sm">
                  <Coins className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-semibold text-terracotta">Por cobrar</span>
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => cambiar("cancelado")}
                className="flex flex-col items-center gap-1 disabled:opacity-50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-sm">
                  <X className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">Cancelar</span>
              </button>
            </>
          )}

          {estado === "por_cobrar" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => cambiar("entregado")}
              className="flex flex-col items-center gap-1 disabled:opacity-50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success text-white shadow-sm">
                <Check className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-semibold text-success">Pagado</span>
            </button>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pending}
                title={LABELS.eliminar}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
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

      {/* Diálogo: entregar por cobrar (con fecha estimada de pago) */}
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
            <Button
              disabled={pending}
              onClick={() => cambiar("por_cobrar", fechaPago)}
            >
              {pending ? LABELS.guardando : "Confirmar entrega"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
