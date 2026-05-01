"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function UserNav({ email }: { email: string | undefined }) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
        className="flex h-9 w-9 items-center justify-center rounded-full border bg-[#EADBCD] text-accent transition-colors hover:bg-danger/10 hover:text-danger"
        title="Cerrar sesion"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
