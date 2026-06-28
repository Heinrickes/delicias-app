"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  Factory,
  Plus,
  Trash2,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  agendarProduccion,
  confirmarProduccion,
  eliminarProduccion,
} from "@/lib/actions/producciones";
import { Button } from "@/components/ui/button";
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
import { LABELS, LOCALE } from "@/lib/constants";

export type TipoEvento = "entrega" | "cobro" | "produccion";

export type EventoCalendario = {
  tipo: TipoEvento;
  fecha: string; // YYYY-MM-DD
  titulo: string;
  detalle: string;
  refId: string;
  completado?: boolean;
};

type Producto = { id: string; nombre: string };

const META: Record<
  TipoEvento,
  { label: string; dot: string; chip: string; icon: typeof Truck }
> = {
  entrega: {
    label: "Entregas",
    dot: "bg-primary",
    chip: "bg-primary/10 text-primary",
    icon: Truck,
  },
  cobro: {
    label: "Cobros",
    dot: "bg-gold",
    chip: "bg-gold/15 text-gold",
    icon: Banknote,
  },
  produccion: {
    label: "Producciones",
    dot: "bg-success",
    chip: "bg-success/15 text-success",
    icon: Factory,
  },
};

const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function Calendario({
  eventos,
  productos,
}: {
  eventos: EventoCalendario[];
  productos: Producto[];
}) {
  const hoy = new Date();
  const [mes, setMes] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [diaSel, setDiaSel] = useState<string | null>(ymd(hoy));
  const [filtros, setFiltros] = useState<Set<TipoEvento>>(
    new Set(["entrega", "cobro", "produccion"])
  );
  const [mostrarCompletados, setMostrarCompletados] = useState(false);

  // Agendar producción
  const [openAgendar, setOpenAgendar] = useState(false);
  const [prodSel, setProdSel] = useState("");
  const [cant, setCant] = useState("");
  const [fecha, setFecha] = useState(ymd(hoy));
  const [nota, setNota] = useState("");
  const [isPending, startTransition] = useTransition();

  const eventosVisibles = useMemo(
    () => eventos.filter(
      (e) => filtros.has(e.tipo) && (mostrarCompletados || !e.completado)
    ),
    [eventos, filtros, mostrarCompletados]
  );
  const porFecha = useMemo(() => {
    const m = new Map<string, EventoCalendario[]>();
    for (const e of eventosVisibles) {
      const arr = m.get(e.fecha) ?? [];
      arr.push(e);
      m.set(e.fecha, arr);
    }
    return m;
  }, [eventosVisibles]);

  const toggleFiltro = (t: TipoEvento) =>
    setFiltros((prev) => {
      const n = new Set(prev);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });

  // Construir la grilla del mes (semana inicia lunes)
  const year = mes.getFullYear();
  const month = mes.getMonth();
  const primerDia = new Date(year, month, 1);
  const offset = (primerDia.getDay() + 6) % 7; // Lun=0
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const celdas: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(new Date(year, month, d));

  const eventosDelDia = diaSel ? porFecha.get(diaSel) ?? [] : [];

  const handleAgendar = (e: React.FormEvent) => {
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
        setOpenAgendar(false);
        setProdSel("");
        setCant("");
        setNota("");
      } else toast.error(r.error);
    });
  };

  const handleConfirmar = (id: string) =>
    startTransition(async () => {
      const r = await confirmarProduccion(id);
      if (r.ok) toast.success("Producción confirmada · stock actualizado");
      else toast.error(r.error);
    });

  const handleEliminar = (id: string) =>
    startTransition(async () => {
      const r = await eliminarProduccion(id);
      if (r.ok) toast.success("Producción eliminada");
      else toast.error(r.error);
    });

  const nombreMesRaw = mes.toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
  const nombreMes = nombreMesRaw.charAt(0).toUpperCase() + nombreMesRaw.slice(1);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
      {/* Calendario */}
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setMes(new Date(year, month - 1, 1))}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="min-w-[10rem] text-center text-base font-semibold text-foreground">
              {nombreMes}
            </h3>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setMes(new Date(year, month + 1, 1))}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" onClick={() => setOpenAgendar(true)}>
            <Plus className="h-4 w-4" />
            Agendar producción
          </Button>
        </div>

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(Object.keys(META) as TipoEvento[]).map((t) => {
            const m = META[t];
            const activo = filtros.has(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleFiltro(t)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activo
                    ? m.chip
                    : "bg-background text-muted-foreground ring-1 ring-foreground/10"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", activo ? m.dot : "bg-muted-foreground/40")} />
                {m.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMostrarCompletados((v) => !v)}
            className={cn(
              "ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors",
              mostrarCompletados
                ? "bg-muted text-foreground ring-foreground/20"
                : "text-muted-foreground ring-foreground/10 hover:text-foreground"
            )}
          >
            <Check className="h-3 w-3" />
            Historial
          </button>
        </div>

        {/* Grilla */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {DIAS_SEMANA.map((d, i) => (
            <div key={i} className="pb-1 text-[11px] font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
          {celdas.map((d, i) => {
            if (!d) return <div key={i} />;
            const clave = ymd(d);
            const evs = porFecha.get(clave) ?? [];
            const esHoy = clave === ymd(hoy);
            const sel = clave === diaSel;
            const tiposActivos = [...new Set(evs.filter((e) => !e.completado).map((e) => e.tipo))];
            const tiposCompletados = [...new Set(evs.filter((e) => e.completado).map((e) => e.tipo))];
            return (
              <button
                key={i}
                type="button"
                onClick={() => setDiaSel(clave)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-start gap-1 rounded-lg border p-1 text-sm transition-colors",
                  sel
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:bg-background/60",
                  esHoy && !sel && "border-foreground/15"
                )}
              >
                <span
                  className={cn(
                    "tabular-nums",
                    esHoy ? "font-bold text-primary" : "text-foreground"
                  )}
                >
                  {d.getDate()}
                </span>
                <span className="flex gap-0.5">
                  {tiposActivos.map((t) => (
                    <span key={t} className={cn("h-1.5 w-1.5 rounded-full", META[t].dot)} />
                  ))}
                  {tiposCompletados.map((t) => (
                    <span key={`c-${t}`} className={cn("h-1.5 w-1.5 rounded-full opacity-40", META[t].dot)} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalle del día */}
      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gold" />
          <h3 className="text-base font-semibold text-foreground">
            {diaSel
              ? new Date(diaSel + "T00:00:00").toLocaleDateString(LOCALE, {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })
              : "Elige un día"}
          </h3>
        </div>

        {eventosDelDia.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sin eventos este día.
          </p>
        ) : (
          <ul className="space-y-3">
            {eventosDelDia.map((e, i) => {
              const m = META[e.tipo];
              const Icon = m.icon;
              return (
                <li key={i} className={cn("rounded-lg border p-3", e.completado && "opacity-60")}>
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                        m.chip
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {e.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground">{e.detalle}</p>
                    </div>
                    {e.completado && (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Completado
                      </span>
                    )}
                  </div>
                  {!e.completado && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {e.tipo === "produccion" ? (
                        <>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleConfirmar(e.refId)}
                          >
                            <Check className="h-4 w-4" />
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => handleEliminar(e.refId)}
                            title={LABELS.eliminar}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Link
                          href={e.tipo === "cobro" ? "/por-cobrar" : "/pedidos"}
                          className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          Ver {e.tipo === "cobro" ? "cobranza" : "pedido"}
                        </Link>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Diálogo agendar producción */}
      <Dialog open={openAgendar} onOpenChange={setOpenAgendar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar producción</DialogTitle>
            <DialogDescription>
              Planifica cuánto producir y cuándo. Al confirmarla se sumará al stock.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAgendar} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Producto</Label>
              <Select
                value={prodSel || "none"}
                onValueChange={(v) => setProdSel(!v || v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-9 w-full">
                  <span className={cn("flex-1 text-left text-sm", !prodSel && "text-muted-foreground")}>
                    {prodSel
                      ? productos.find((p) => p.id === prodSel)?.nombre ?? "Elige…"
                      : "Elige…"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Elige…</SelectItem>
                  {productos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cal-cant">Cantidad</Label>
                <NumericInput
                  id="cal-cant"
                  min="1"
                  value={cant}
                  onChange={setCant}
                  placeholder="12"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <DatePicker
                  value={fecha}
                  onChange={setFecha}
                  placeholder="Seleccionar fecha"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cal-nota">{LABELS.notas} (opcional)</Label>
              <Textarea
                id="cal-nota"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenAgendar(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? LABELS.guardando : "Agendar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
