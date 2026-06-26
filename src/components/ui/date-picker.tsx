"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const DIAS = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function primerDiaSemana(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // lunes = 0
}

function diasEnMes(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const hoy = new Date();
  const seleccionada = value ? new Date(value + "T12:00:00") : null;

  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(seleccionada?.getFullYear() ?? hoy.getFullYear());
  const [month, setMonth] = useState(seleccionada?.getMonth() ?? hoy.getMonth());

  const mesAnterior = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const mesSiguiente = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const elegirDia = (dia: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(dia).padStart(2, "0");
    onChange(`${year}-${m}-${d}`);
    setOpen(false);
  };

  const elegirHoy = () => {
    setYear(hoy.getFullYear());
    setMonth(hoy.getMonth());
    const m = String(hoy.getMonth() + 1).padStart(2, "0");
    const d = String(hoy.getDate()).padStart(2, "0");
    onChange(`${hoy.getFullYear()}-${m}-${d}`);
    setOpen(false);
  };

  // Construir grilla
  const primer = primerDiaSemana(year, month);
  const total = diasEnMes(year, month);
  const celdas: (number | null)[] = [
    ...Array(primer).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const esHoy = (dia: number) =>
    dia === hoy.getDate() && month === hoy.getMonth() && year === hoy.getFullYear();

  const esSeleccionado = (dia: number) =>
    !!seleccionada &&
    dia === seleccionada.getDate() &&
    month === seleccionada.getMonth() &&
    year === seleccionada.getFullYear();

  const textoFecha = seleccionada
    ? `${seleccionada.getDate()} de ${MESES[seleccionada.getMonth()]} ${seleccionada.getFullYear()}`
    : "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          textoFecha ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span>{textoFecha || placeholder}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="max-w-[320px] p-5">
          {/* Navegación mes/año */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={mesAnterior}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {MESES[month].charAt(0).toUpperCase() + MESES[month].slice(1)} de {year}
            </span>
            <button
              type="button"
              onClick={mesSiguiente}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Cabecera días semana */}
          <div className="mb-1 grid grid-cols-7">
            {DIAS.map((d) => (
              <div
                key={d}
                className="flex h-8 items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grilla días */}
          <div className="grid grid-cols-7">
            {celdas.map((dia, i) => (
              <div key={i} className="flex items-center justify-center p-0.5">
                {dia ? (
                  <button
                    type="button"
                    onClick={() => elegirDia(dia)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors",
                      esSeleccionado(dia)
                        ? "bg-primary font-semibold text-primary-foreground"
                        : esHoy(dia)
                          ? "border border-primary font-semibold text-primary"
                          : "text-foreground hover:bg-muted"
                    )}
                  >
                    {dia}
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {/* Pie */}
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={elegirHoy}
              className="text-sm font-medium text-primary hover:underline"
            >
              Hoy
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
