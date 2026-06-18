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
    <div className="group relative rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:shadow-[0_18px_40px_rgba(75,45,30,0.08)]">
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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

      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-base text-primary">
          {iniciales || "?"}
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-serif text-lg text-foreground">
            {cliente.nombre}
          </h3>
          {cliente.notas && (
            <p className="truncate text-xs text-muted-foreground">
              {cliente.notas}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        {cliente.telefono && (
          <p className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-gold" />
            {cliente.telefono}
          </p>
        )}
        {cliente.email && (
          <p className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-gold" />
            <span className="truncate">{cliente.email}</span>
          </p>
        )}
        {cliente.direccion && (
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-gold" />
            <span className="truncate">{cliente.direccion}</span>
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
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
