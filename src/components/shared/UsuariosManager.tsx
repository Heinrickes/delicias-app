"use client";

import { useTransition } from "react";
import { Users, ShieldCheck } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { actualizarPerfil, type Perfil, type Rol } from "@/lib/actions/perfiles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

const ROL_LABEL: Record<Rol, string> = {
  admin: "Administrador",
  dueña: "Dueña",
  colaborador: "Colaborador",
};

function FilaUsuario({ perfil, esUno }: { perfil: Perfil; esUno: boolean }) {
  const [isPending, startTransition] = useTransition();

  const cambiarRol = (rol: Rol) => {
    startTransition(async () => {
      const r = await actualizarPerfil(perfil.id, { rol });
      if (r.ok) toast.success("Rol actualizado");
      else toast.error(r.error);
    });
  };

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {perfil.nombre.slice(0, 1).toUpperCase() || "?"}
        </span>
        <span className="truncate text-sm font-medium text-foreground">
          {perfil.nombre || "Sin nombre"}
          {esUno && <span className="ml-1.5 text-xs text-muted-foreground">(tú)</span>}
        </span>
      </div>
      {esUno ? (
        <Tooltip content="No puedes cambiar tu propio rol" className="h-8 w-40 items-center justify-end px-2">
          <span className="text-sm text-muted-foreground">{ROL_LABEL[perfil.rol]}</span>
        </Tooltip>
      ) : (
        <Select
          value={perfil.rol}
          onValueChange={(v) => cambiarRol(v as Rol)}
          disabled={isPending}
        >
          <SelectTrigger className="h-8 w-40">
            <span className="flex-1 text-left text-sm">{ROL_LABEL[perfil.rol]}</span>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ROL_LABEL) as Rol[]).map((r) => (
              <SelectItem key={r} value={r}>
                {ROL_LABEL[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </li>
  );
}

export function UsuariosManager({
  perfiles,
  currentUserId,
}: {
  perfiles: Perfil[];
  currentUserId: string;
}) {
  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="mb-2 flex items-center gap-2">
        <Users className="h-4 w-4 text-gold" />
        <h3 className="text-base font-semibold text-foreground">Usuarios</h3>
      </div>
      <p className="mb-2 flex items-start gap-1.5 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Los roles son de trazabilidad (quién hizo qué). Solo un administrador
        puede cambiar roles.
      </p>
      {perfiles.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Sin usuarios registrados todavía.
        </p>
      ) : (
        <ul className="divide-y">
          {perfiles.map((p) => (
            <FilaUsuario key={p.id} perfil={p} esUno={p.id === currentUserId} />
          ))}
        </ul>
      )}
    </section>
  );
}
