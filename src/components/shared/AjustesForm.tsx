"use client";

import { useState, useTransition } from "react";
import { Truck, Coins, Boxes, Factory, Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { actualizarAjustes } from "@/lib/actions/ajustes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Ajustes = {
  avisar_entregas: boolean;
  avisar_cobros: boolean;
  avisar_stock: boolean;
  avisar_produccion: boolean;
  dias_anticipacion: number;
};

const TIPOS = [
  { key: "avisar_entregas", label: "Entregas de pedidos", icon: Truck },
  { key: "avisar_cobros", label: "Cuentas por cobrar", icon: Coins },
  { key: "avisar_stock", label: "Stock bajo", icon: Boxes },
  { key: "avisar_produccion", label: "Producciones agendadas", icon: Factory },
] as const;

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200",
        on ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          on ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function AjustesForm({ inicial }: { inicial: Ajustes }) {
  const [form, setForm] = useState(inicial);
  const [isPending, startTransition] = useTransition();
  const [pushEstado, setPushEstado] = useState<string>("");

  const guardar = () => {
    startTransition(async () => {
      const r = await actualizarAjustes(form);
      if (r.ok) toast.success("Ajustes guardados");
      else toast.error(r.error);
    });
  };

  const probarNotificacion = async () => {
    if (!("Notification" in window)) {
      setPushEstado("Este navegador no soporta notificaciones.");
      return;
    }
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") {
      setPushEstado("Permiso denegado. Actívalo en el navegador.");
      return;
    }
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification("Delicias Caseras", {
        body: "Las notificaciones están activas en este dispositivo.",
        icon: "/icon.svg",
        badge: "/icon.svg",
      });
    } else {
      new Notification("Delicias Caseras", {
        body: "Las notificaciones están activas en este dispositivo.",
      });
    }
    setPushEstado("Permiso concedido ✓");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-gold" />
          <h3 className="text-base font-semibold text-foreground">Avisos</h3>
        </div>

        <ul className="divide-y">
          {TIPOS.map((t) => {
            const Icon = t.icon;
            const on = form[t.key];
            return (
              <li key={t.key} className="flex items-center justify-between gap-4 py-3">
                <span className="flex min-w-0 items-center gap-3 text-sm text-foreground">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {t.label}
                </span>
                <Toggle on={on} onChange={(v) => setForm((f) => ({ ...f, [t.key]: v }))} />
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex items-center justify-between gap-4 border-t pt-4">
          <div>
            <Label htmlFor="dias">Días de anticipación</Label>
            <p className="text-xs text-muted-foreground">
              Avisar entregas, cobros y producciones con esta antelación.
            </p>
          </div>
          <Input
            id="dias"
            type="number"
            min="0"
            max="30"
            value={form.dias_anticipacion}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                dias_anticipacion: parseInt(e.target.value) || 0,
              }))
            }
            className="w-20 text-center"
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={guardar} disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </section>

      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="mb-2 flex items-center gap-2">
          <BellRing className="h-4 w-4 text-gold" />
          <h3 className="text-base font-semibold text-foreground">
            Notificaciones del dispositivo
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Activa los permisos para recibir avisos como notificación. Para que
          lleguen con la app cerrada (push programado), queda pendiente la
          configuración del servidor de envío.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" onClick={probarNotificacion}>
            <BellRing className="h-4 w-4" />
            Activar y probar
          </Button>
          {pushEstado && (
            <span className="text-xs text-muted-foreground">{pushEstado}</span>
          )}
        </div>
      </section>
    </div>
  );
}
