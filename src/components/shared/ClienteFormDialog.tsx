"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import {
  actualizarCliente,
  crearCliente,
  type ClienteInput,
} from "@/lib/actions/clientes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LABELS } from "@/lib/constants";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
};

export function ClienteFormDialog({
  cliente,
  trigger,
}: {
  cliente?: Cliente;
  trigger: ReactNode;
}) {
  const esEdicion = Boolean(cliente);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ClienteInput>({
    nombre: cliente?.nombre ?? "",
    telefono: cliente?.telefono ?? "",
    email: cliente?.email ?? "",
    direccion: cliente?.direccion ?? "",
    notas: cliente?.notas ?? "",
  });
  const [isPending, startTransition] = useTransition();

  const set = (campo: keyof ClienteInput, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const resetParaEdicion = () =>
    setForm({
      nombre: cliente?.nombre ?? "",
      telefono: cliente?.telefono ?? "",
      email: cliente?.email ?? "",
      direccion: cliente?.direccion ?? "",
      notas: cliente?.notas ?? "",
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result =
        esEdicion && cliente
          ? await actualizarCliente(cliente.id, form)
          : await crearCliente(form);

      if (result.ok) {
        toast.success(esEdicion ? "Cliente actualizado" : "Cliente agregado");
        setOpen(false);
        if (!esEdicion) {
          setForm({ nombre: "", telefono: "", email: "", direccion: "", notas: "" });
        }
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
        if (!o && esEdicion) resetParaEdicion();
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
          <DialogDescription>
            Datos de contacto del cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">{LABELS.nombre}</Label>
            <Input
              id="nombre"
              required
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej: María González"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="telefono">{LABELS.telefono}</Label>
              <Input
                id="telefono"
                value={form.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{LABELS.email}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="maria@ejemplo.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="direccion">{LABELS.direccion}</Label>
            <Input
              id="direccion"
              value={form.direccion}
              onChange={(e) => set("direccion", e.target.value)}
              placeholder="Calle, número, comuna"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notas">{LABELS.notas}</Label>
            <Textarea
              id="notas"
              value={form.notas}
              onChange={(e) => set("notas", e.target.value)}
              placeholder="Preferencias, alergias, etc."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? LABELS.guardando : LABELS.guardar}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
