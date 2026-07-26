"use client";

import { useTransition } from "react";
import { Trash2, Pencil, ClipboardList, History } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { eliminarCliente } from "@/lib/actions/clientes";
import { ClienteFormDialog } from "@/components/shared/ClienteFormDialog";
import { CardPopover } from "@/components/shared/CardPopover";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
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
  onVerHistorial,
}: {
  cliente: Cliente;
  pedidos: number;
  totalVentas: number;
  onVerHistorial: () => void;
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
    <CardPopover
      layout="row"
      imageUrl={null}
      placeholder={
        <span className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-semibold text-primary">
          {iniciales || "?"}
        </span>
      }
      title={cliente.nombre}
      keyValue={`${pedidos} ${pedidos === 1 ? "pedido" : "pedidos"} · ${formatMoneda(totalVentas)}`}
      fields={[
        { label: "Teléfono", value: cliente.telefono ?? "—" },
        { label: "Correo", value: cliente.email ?? "—" },
        { label: "Pedidos", value: `${pedidos} ${pedidos === 1 ? "pedido" : "pedidos"}` },
        { label: "Total gastado", value: formatMoneda(totalVentas) },
        ...(cliente.direccion ? [{ label: "Dirección", value: cliente.direccion }] : []),
        ...(cliente.notas ? [{ label: "Notas", value: cliente.notas }] : []),
      ]}
      actions={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip content="Historial">
              <Button variant="outline" size="icon-sm" onClick={onVerHistorial}>
                <History className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
            <ClienteFormDialog
              cliente={cliente}
              trigger={
                <Tooltip content={LABELS.editar}>
                  <Button variant="ghost" size="icon-sm">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
              }
            />
            <Tooltip content="Ver pedidos">
              <Link
                href="/pedidos"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <ClipboardList className="h-3.5 w-3.5" />
              </Link>
            </Tooltip>
          </div>
          <AlertDialog>
            <Tooltip content={LABELS.eliminar}>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={deleting}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />
            </Tooltip>
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
      }
    />
  );
}
