"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function UserNav({ email }: { email: string | undefined }) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <div className="hidden flex-col items-end sm:flex">
        <p className="max-w-32 truncate text-xs font-medium text-foreground">
          {email}
        </p>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">
          Administrador
        </p>
      </div>
      <button
        onClick={handleSignOut}
        className="group relative flex h-9 w-9 items-center justify-center rounded-full border bg-secondary text-primary transition-colors hover:bg-danger/10 hover:text-danger"
        aria-label="Cerrar sesión"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-[100] -translate-x-1/2 whitespace-nowrap rounded-lg border bg-card px-2.5 py-1 text-[11px] font-semibold tracking-wide text-foreground shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          Cerrar sesión
        </span>
      </button>
    </div>
  );
}
