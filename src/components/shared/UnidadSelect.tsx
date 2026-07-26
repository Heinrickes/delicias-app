"use client";

import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const NUEVA = "__nueva__";

/**
 * Selector de unidad con opciones existentes (derivadas de los insumos ya
 * registrados) + opción para escribir una nueva. La nueva unidad queda
 * disponible para futuros insumos apenas se guarda el que la usa.
 */
export function UnidadSelect({
  id,
  value,
  onChange,
  unidadesExistentes,
  modoNueva,
  onModoNuevaChange,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  unidadesExistentes: string[];
  modoNueva: boolean;
  onModoNuevaChange: (v: boolean) => void;
}) {
  if (modoNueva) {
    return (
      <Input
        id={id}
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: onza"
      />
    );
  }

  return (
    <Select
      value={unidadesExistentes.includes(value) ? value : undefined}
      onValueChange={(v) => {
        if (v === NUEVA) {
          onModoNuevaChange(true);
          onChange("");
        } else {
          onChange(v ?? "");
        }
      }}
    >
      <SelectTrigger id={id} className="h-9 w-full">
        <span className={cn("flex-1 text-left text-sm", !value && "text-muted-foreground")}>
          {value || "Elegir unidad"}
        </span>
      </SelectTrigger>
      <SelectContent>
        {unidadesExistentes.map((u) => (
          <SelectItem key={u} value={u}>
            {u}
          </SelectItem>
        ))}
        {unidadesExistentes.length > 0 && <SelectSeparator />}
        <SelectItem value={NUEVA}>
          <Plus className="h-3.5 w-3.5" /> Nueva unidad
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
