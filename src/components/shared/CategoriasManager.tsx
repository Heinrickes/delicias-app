"use client";

import {
  cloneElement,
  isValidElement,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  crearCategoria,
  renombrarCategoria,
  eliminarCategoria,
} from "@/lib/actions/categorias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LABELS } from "@/lib/constants";

type Categoria = { id: string; nombre: string };

export function CategoriasManager({
  categorias,
  trigger,
}: {
  categorias: Categoria[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [nueva, setNueva] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [isPending, startTransition] = useTransition();

  const agregar = () => {
    if (!nueva.trim()) return;
    startTransition(async () => {
      const r = await crearCategoria(nueva);
      if (r.ok) {
        toast.success("Categoría creada");
        setNueva("");
      } else toast.error(r.error);
    });
  };

  const guardar = (id: string) => {
    startTransition(async () => {
      const r = await renombrarCategoria(id, editNombre);
      if (r.ok) {
        toast.success("Categoría actualizada");
        setEditId(null);
      } else toast.error(r.error);
    });
  };

  const borrar = (id: string) => {
    startTransition(async () => {
      const r = await eliminarCategoria(id);
      if (r.ok) toast.success("Categoría eliminada");
      else toast.error(r.error);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isValidElement(trigger)
        ? cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
            onClick: () => setOpen(true),
          })
        : trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Categorías</DialogTitle>
          <DialogDescription>
            Crea y organiza las categorías de tus productos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-2">
          <Input
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            placeholder="Nueva categoría (ej. Bombones)"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                agregar();
              }
            }}
          />
          <Button onClick={agregar} disabled={isPending || !nueva.trim()}>
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>

        {categorias.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aún no hay categorías.
          </p>
        ) : (
          <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
            {categorias.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                {editId === c.id ? (
                  <>
                    <Input
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="h-8"
                      autoFocus
                    />
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon-sm"
                        onClick={() => guardar(c.id)}
                        disabled={isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setEditId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="truncate text-sm text-foreground">
                      {c.nombre}
                    </span>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        title={LABELS.editar}
                        onClick={() => {
                          setEditId(c.id);
                          setEditNombre(c.nombre);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        title={LABELS.eliminar}
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => borrar(c.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
