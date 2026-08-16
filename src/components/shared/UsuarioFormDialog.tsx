"use client";

import {
  cloneElement,
  isValidElement,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { crearUsuario, type Rol } from "@/lib/actions/perfiles";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ROL_LABEL: Record<Rol, string> = {
  admin: "Administrador",
  dueña: "Dueña",
  colaborador: "Colaborador",
};

function generarPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const FORM_VACIO = { nombre: "", email: "", password: "", rol: "colaborador" as Rol };

export function UsuarioFormDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof typeof form>(campo: K, valor: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await crearUsuario(form);
      if (result.ok) {
        toast.success(`Usuario creado. Compartile el correo y la contraseña.`);
        setOpen(false);
        setForm(FORM_VACIO);
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
        if (!o) setForm(FORM_VACIO);
      }}
    >
      {isValidElement(trigger)
        ? cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
            onClick: () => setOpen(true),
          })
        : trigger}
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            Creá la cuenta y compartile las credenciales por fuera de la app.
            No existe registro público — esta es la única forma de dar de alta a alguien.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              required
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej: Natalia Pérez"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="natalia@ejemplo.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="flex-1"
              />
              <Tooltip content="Generar contraseña" side="top">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => set("password", generarPassword())}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rol">Rol</Label>
            <Select value={form.rol} onValueChange={(v) => set("rol", v as Rol)}>
              <SelectTrigger id="rol">
                <span className="flex-1 text-left text-sm">{ROL_LABEL[form.rol]}</span>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROL_LABEL) as Rol[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROL_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Tooltip content="Cancelar" side="top">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Crear usuario" side="top">
              <Button type="submit" size="icon-sm" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </Tooltip>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
