"use client";

import { useEffect } from "react";

/** Registra el service worker para habilitar PWA y notificaciones. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* silencioso: el SW es mejora progresiva */
      });
    }
  }, []);
  return null;
}
