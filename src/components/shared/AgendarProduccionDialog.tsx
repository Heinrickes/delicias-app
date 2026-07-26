"use client";

import { cloneElement, isValidElement, useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { agendarProduccion } from "@/lib/actions/producciones";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
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

type Producto = { id: string; nombre: string };

function ymdHoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AgendarProduccionDialog({
  productos,
  trigger,
}: {
  productos: Producto[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [prodSel, setProdSel] = useState("");
  const [cant, setCant] = useState("");
  const [fecha, setFecha] = useState(ymdHoy());
  const [nota, setNota] = useState("");
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setProdSel("");
    setCant("");
    setFecha(ymdHoy());
    setNota("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await agendarProduccion({
        producto_id: prodSel,
        cantidad: parseInt(cant) || 0,
        fecha_plan: fecha,
        nota,
      });
      if (r.ok) {
        toast.success("Producción agendada");
        reset();
        setOpen(false);
      } else {
        toast.error(r.error);
      }
    });
  };

  return (
    <>
      {isValidElement(trigger)
        ? cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
            onClick: () => setOpen(true),
          })
        : trigger}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Agendar producción</DialogTitle>
            <DialogDescription>
              Planifica cuánto producir y cuándo. Al confirmarla se sumará al stock.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Producto</Label>
              <Select
                value={prodSel || "none"}
                onValueChange={(v) => setProdSel(!v || v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-9 w-full">
                  <span className={cn("flex-1 text-left text-sm", !prodSel && "text-muted-foreground")}>
                    {prodSel ? productos.find((p) => p.id === prodSel)?.nombre ?? "Elige…" : "Elige…"}
                  </span>
                </SelectTrigger>
                <SelectContent className="max-h-52 overflow-y-auto">
                  <SelectItem value="none">Elige…</SelectItem>
                  {productos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ap-cant">Cantidad</Label>
                <NumericInput
                  id="ap-cant"
                  min="1"
                  value={cant}
                  onChange={setCant}
                  placeholder="12"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <DatePicker value={fecha} onChange={setFecha} placeholder="Seleccionar fecha" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-nota">{LABELS.notas} (opcional)</Label>
              <Textarea
                id="ap-nota"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Tooltip content={LABELS.cancelar} side="top">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Tooltip>
              <Tooltip content="Agendar" side="top">
                <Button
                  type="submit"
                  size="icon-sm"
                  disabled={isPending || !prodSel || !cant}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
              </Tooltip>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
