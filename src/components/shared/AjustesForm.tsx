"use client";

import { useState, useTransition } from "react";
import { Truck, Coins, Boxes, Factory, Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { actualizarAjustes } from "@/lib/actions/ajustes";
import {
  guardarSuscripcionPush,
  enviarPushATodos,
} from "@/lib/actions/push";
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

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

export function AjustesForm({ inicial }: { inicial: Ajustes }) {
  const [form, setForm] = useState(inicial);
  const [isPending, startTransition] = useTransition();
  const [pushEstado, setPushEstado] = useState<string>("");
  const [pushPending, setPushPending] = useState(false);

  const guardar = () => {
    startTransition(async () => {
      const r = await actualizarAjustes(form);
      if (r.ok) toast.success("Ajustes guardados");
      else toast.error(r.error);
    });
  };

  const activarPush = async () => {
    setPushPending(true);
    setPushEstado("");
    try {
      if (!("Notification" in window)) {
        setPushEstado("Este navegador no soporta notificaciones.");
        return;
      }
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setPushEstado("Permiso denegado. Actívalo en la configuración del navegador.");
        return;
      }
      if (!("serviceWorker" in navigator)) {
        setPushEstado("Service Worker no disponible en este navegador.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setPushEstado("Clave VAPID no configurada.");
        return;
      }

      // Suscribir al push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const { endpoint, keys } = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      // Guardar suscripción en DB
      const saveResult = await guardarSuscripcionPush({
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
      if (!saveResult.ok) {
        setPushEstado("Error al guardar suscripción.");
        return;
      }

      // Enviar notificación de prueba desde el servidor
      const sendResult = await enviarPushATodos(
        "Delicias Caseras",
        "Las notificaciones push están activas en este dispositivo. ✓",
        "/"
      );

      if (sendResult.ok) {
        setPushEstado("Notificación enviada ✓ — revisá el celular");
        toast.success("Push activado correctamente");
      } else {
        setPushEstado("Suscripción guardada, pero el envío de prueba falló.");
      }
    } catch (err) {
      console.error(err);
      setPushEstado("Error inesperado. Revisá la consola.");
    } finally {
      setPushPending(false);
    }
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
          Activa los permisos para recibir avisos como notificación push en este
          dispositivo, incluso con la app cerrada.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" onClick={activarPush} disabled={pushPending}>
            <BellRing className="h-4 w-4" />
            {pushPending ? "Activando…" : "Activar y probar"}
          </Button>
          {pushEstado && (
            <span className="text-xs text-muted-foreground">{pushEstado}</span>
          )}
        </div>
      </section>
    </div>
  );
}
