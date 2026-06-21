"use client";

import { useState, useTransition } from "react";
import { PackagePlus } from "lucide-react";
import { toast } from "sonner";
import {
  ajustarStock,
  definirStockMinimo,
  registrarMerma,
  registrarProduccion,
} from "@/lib/actions/stock";
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
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { LABELS } from "@/lib/constants";

type Tipo = "produccion" | "merma" | "ajuste" | "umbral";

const TABS: { tipo: Tipo; label: string }[] = [
  { tipo: "produccion", label: "Producción" },
  { tipo: "merma", label: "Merma" },
  { tipo: "ajuste", label: "Ajuste" },
  { tipo: "umbral", label: "Umbral" },
];

const CONFIG: Record<Tipo, { titulo: string; campo: string; placeholder: string }> = {
  produccion: {
    titulo: "Registrar producción",
    campo: "Cantidad producida",
    placeholder: "12",
  },
  merma: {
    titulo: "Registrar merma",
    campo: "Cantidad perdida",
    placeholder: "2",
  },
  ajuste: {
    titulo: "Ajustar stock",
    campo: "Stock real (conteo)",
    placeholder: "10",
  },
  umbral: {
    titulo: "Umbral de stock bajo",
    campo: "Avisar cuando el stock baje de",
    placeholder: "10",
  },
};

export function StockMovimientoDialog({
  producto,
}: {
  producto: { id: string; nombre: string; stock: number; stock_minimo?: number };
}) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<Tipo>("produccion");
  const [valor, setValor] = useState("");
  const [nota, setNota] = useState("");
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setTipo("produccion");
    setValor("");
    setNota("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(valor);
    if (!Number.isFinite(num)) {
      toast.error("Ingresa un número válido");
      return;
    }

    startTransition(async () => {
      const result =
        tipo === "produccion"
          ? await registrarProduccion(producto.id, num, nota)
          : tipo === "merma"
            ? await registrarMerma(producto.id, num, nota)
            : tipo === "ajuste"
              ? await ajustarStock(producto.id, num, nota)
              : await definirStockMinimo(producto.id, num);

      if (result.ok) {
        toast.success(`${CONFIG[tipo].titulo}: ${producto.nombre}`);
        reset();
        setOpen(false);
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
        if (!o) reset();
      }}
    >
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PackagePlus className="h-4 w-4" />
        Movimiento
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{producto.nombre}</DialogTitle>
          <DialogDescription>
            Stock actual: {producto.stock}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
            {TABS.map((t) => (
              <button
                key={t.tipo}
                type="button"
                onClick={() => {
                  setTipo(t.tipo);
                  setValor(
                    t.tipo === "umbral"
                      ? String(producto.stock_minimo ?? "")
                      : ""
                  );
                }}
                className={cn(
                  "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  tipo === t.tipo
                    ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="valor">{CONFIG[tipo].campo}</Label>
            <Input
              id="valor"
              type="number"
              min={tipo === "ajuste" || tipo === "umbral" ? "0" : "1"}
              required
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={CONFIG[tipo].placeholder}
              autoFocus
            />
          </div>

          {tipo !== "umbral" && (
            <div className="space-y-1.5">
              <Label htmlFor="nota">{LABELS.notas} (opcional)</Label>
              <Textarea
                id="nota"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej: Lote del día, ingredientes frescos…"
                rows={2}
              />
            </div>
          )}

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
