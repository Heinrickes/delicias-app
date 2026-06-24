"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Ya instalada → no mostrar
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  const instalar = async () => {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
    else setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-card px-4 py-2.5 shadow-xl ring-1 ring-foreground/10 lg:bottom-6">
      <span className="text-sm font-medium text-foreground">
        Instalar Delicias Caseras
      </span>
      <button
        onClick={instalar}
        className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
      >
        <Download className="h-3.5 w-3.5" />
        Instalar
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-xs text-muted-foreground hover:text-foreground"
        aria-label="Cerrar"
      >
        ✕
      </button>
    </div>
  );
}
