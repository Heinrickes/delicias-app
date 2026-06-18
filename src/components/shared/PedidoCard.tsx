"use client";

import { useTransition } from "react";
import { CalendarDays, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { cambiarEstadoPedido, eliminarPedido } from "@/lib/actions/pedidos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  estado: string;
  total: number;
  notas: string | null;
  cliente: string | null;
  items: PedidoItem[];
};

const estadoBadge: Record<EstadoPedido, string> = {
  pendiente: "bg-gold/15 text-gold",
  en_proceso: "bg-primary/10 text-primary",
  listo: "bg-olive/15 text-olive",
  entregado: "bg-success/15 text-success",
  cancelado: "bg-danger/15 text-danger",
};

const selectClass =
  "h-8 rounded-lg border border-input bg-card px-2 text-xs font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function PedidoCard({ pedido }: { pedido: Pedido }) {
  const [pending, startTransition] = useTransition();
  const estado = pedido.estado as EstadoPedido;

  const handleEstado = (nuevo: EstadoPedido) => {
    if (nuevo === estado) return;
    startTransition(async () => {
      const result = await cambiarEstadoPedido(pedido.id, nuevo);
      if (result.ok) {
        toast.success(
          nuevo === "entregado"
            ? "Pedido entregado · venta y stock actualizados"
            : `Estado: ${ESTADOS_PEDIDO[nuevo]}`
        );
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

  const fecha = pedido.fecha_entrega
    ? new Date(pedido.fecha_entrega + "T00:00:00").toLocaleDateString(LOCALE, {
        weekday: "short",
        day: "2-digit",
        month: "short",
      })
    : "Sin fecha";

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
            Entrega: {fecha}
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

      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">{LABELS.total}</span>
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {formatMoneda(pedido.total)}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <select
          value={estado}
          disabled={pending}
          onChange={(e) => handleEstado(e.target.value as EstadoPedido)}
          className={`flex-1 ${selectClass}`}
        >
          {(Object.keys(ESTADOS_PEDIDO) as EstadoPedido[]).map((k) => (
            <option key={k} value={k}>
              {ESTADOS_PEDIDO[k]}
            </option>
          ))}
        </select>

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
    </div>
  );
}
