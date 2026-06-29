"use client";

import { useTransition } from "react";
import { User, Trash2, Pencil, ClipboardList } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { eliminarCliente } from "@/lib/actions/clientes";
import { ClienteFormDialog } from "@/components/shared/ClienteFormDialog";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
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
    <CollapsibleCard
      icon={
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {iniciales || "?"}
        </span>
      }
      title={cliente.nombre}
      badge={
        <Badge className="shrink-0 bg-muted text-[10px] text-muted-foreground">
          {pedidos} {pedidos === 1 ? "pedido" : "pedidos"}
        </Badge>
      }
      subtitle={
        <span className="font-medium text-success">{formatMoneda(totalVentas)}</span>
      }
      fields={[
        { label: "Teléfono", value: cliente.telefono ?? "—" },
        { label: "Correo", value: cliente.email ?? "—" },
        { label: "Pedidos", value: `${pedidos} ${pedidos === 1 ? "pedido" : "pedidos"}` },
        { label: "Total gastado", value: formatMoneda(totalVentas) },
        ...(cliente.direccion ? [{ label: "Dirección", value: cliente.direccion }] : []),
        ...(cliente.notas ? [{ label: "Notas", value: cliente.notas }] : []),
      ]}
      actions={
        <>
          <ClienteFormDialog
            cliente={cliente}
            trigger={
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                {LABELS.editar}
              </Button>
            }
          />
          <Link
            href="/pedidos"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Ver pedidos
          </Link>
          <div className="flex-1" />
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
        </>
      }
    />
  );
}
