"use client";

import { useTransition } from "react";
import { Phone, Mail, MapPin, Pencil, Trash2, ShoppingBag, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { eliminarCliente } from "@/lib/actions/clientes";
import { ClienteFormDialog } from "@/components/shared/ClienteFormDialog";
import { Button } from "@/components/ui/button";
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
import { formatMoneda, LABELS } from "@/lib/constants";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
};

export function ClienteCard({
  cliente,
  pedidos,
  totalVentas,
}: {
  cliente: Cliente;
  pedidos: number;
  totalVentas: number;
}) {
  const [deleting, startDeleting] = useTransition();

  const handleBorrar = () => {
    startDeleting(async () => {
      const result = await eliminarCliente(cliente.id);
      if (result.ok) toast.success("Cliente eliminado");
      else toast.error(result.error);
    });
  };

  const iniciales = cliente.nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="group relative rounded-xl bg-card p-3.5 ring-1 ring-foreground/10 transition-shadow hover:shadow-[0_18px_40px_rgba(75,45,30,0.08)]">
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <ClienteFormDialog
          cliente={cliente}
          trigger={
            <Button variant="ghost" size="icon-sm" title={LABELS.editar}>
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={deleting}
                title={LABELS.eliminar}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará &quot;{cliente.nombre}&quot;. Sus pedidos y ventas
                se conservan sin cliente asociado.
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

      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {iniciales || "?"}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {cliente.nombre}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {cliente.telefono && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 text-gold" />
                {cliente.telefono}
              </span>
            )}
            {cliente.email && (
              <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0 text-gold" />
                <span className="truncate">{cliente.email}</span>
              </span>
            )}
            {cliente.direccion && (
              <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0 text-gold" />
                <span className="truncate">{cliente.direccion}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t pt-2.5 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <ClipboardList className="h-3.5 w-3.5" />
          {pedidos} {pedidos === 1 ? "pedido" : "pedidos"}
        </span>
        <span className="flex items-center gap-1.5 font-medium text-success">
          <ShoppingBag className="h-3.5 w-3.5" />
          {formatMoneda(totalVentas)}
        </span>
      </div>
    </div>
  );
}
