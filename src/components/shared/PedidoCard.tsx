"use client";

import { useState, useTransition } from "react";
import { Trash2, User, Check, Coins, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { cambiarEstadoPedido, eliminarPedido } from "@/lib/actions/pedidos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
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

  const deleteButton = (
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
  );

  return (
    <>
      <CollapsibleCard
        icon={<User className="h-4 w-4" />}
        title={pedido.cliente ?? "Sin cliente"}
        badge={
          <Badge className={cn("shrink-0 text-[10px]", estadoBadgeClasses[estado] ?? "bg-muted")}>
            {ESTADOS_PEDIDO[estado] ?? pedido.estado}
          </Badge>
        }
        subtitle={
          <span>
            {fmtFecha(pedido.fecha_entrega)} · {formatMoneda(pedido.total)}
          </span>
        }
        fields={[
          { label: "Total", value: formatMoneda(pedido.total) },
          { label: "Estado", value: ESTADOS_PEDIDO[estado] ?? pedido.estado },
          ...(estado === "por_cobrar" && pedido.fecha_estimada_pago
            ? [{ label: "Fecha cobro", value: fmtFecha(pedido.fecha_estimada_pago), className: pagoVencido ? "text-danger" : undefined }]
            : []),
        ]}
      >
        {/* Items */}
        <ul className="mb-1 space-y-0.5">
          {pedido.items.map((it, idx) => (
            <li key={idx} className="truncate text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{it.cantidad}×</span>{" "}
              {it.nombre_producto}
            </li>
          ))}
          {pedido.notas && (
            <li className="truncate text-[11px] italic text-muted-foreground">
              {pedido.notas}
            </li>
          )}
        </ul>

        {/* Acciones */}
        <div className="mt-2 flex items-center justify-between border-t pt-2">
          <div className="flex gap-2">
            {estado === "pendiente" && (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => cambiar("entregado")}
                  className="flex flex-col items-center gap-0.5 disabled:opacity-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white shadow-sm">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[9px] font-semibold text-success">Cobrar</span>
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setCobrarOpen(true)}
                  className="flex flex-col items-center gap-0.5 disabled:opacity-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta text-white shadow-sm">
                    <Coins className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[9px] font-semibold text-terracotta">Por cobrar</span>
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => cambiar("cancelado")}
                  className="flex flex-col items-center gap-0.5 disabled:opacity-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-sm">
                    <X className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[9px] font-semibold text-muted-foreground">Cancelar</span>
                </button>
              </>
            )}
            {estado === "por_cobrar" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => cambiar("entregado")}
                className="flex flex-col items-center gap-0.5 disabled:opacity-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white shadow-sm">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-[9px] font-semibold text-success">Pagado</span>
              </button>
            )}
          </div>
          {deleteButton}
        </div>
      </CollapsibleCard>

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
            <Button
              disabled={pending}
              onClick={() => cambiar("por_cobrar", fechaPago)}
            >
              {pending ? LABELS.guardando : "Confirmar entrega"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
