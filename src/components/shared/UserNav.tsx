"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

export function UserNav({ email }: { email: string | undefined }) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh(); // Esto activará el middleware y te mandará al login
  };

  return (
    <div className="flex items-center gap-4 border-l pl-4">
      <div className="flex flex-col items-end">
        <p className="text-xs font-medium text-foreground">{email}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Administrador</p>
      </div>
      <button
        onClick={handleSignOut}
        className="flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
        title="Cerrar sesión"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}