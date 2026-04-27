"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Lock, Mail, Key, LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        
        {/* Cabecera */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Lock className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Delicias Caseras
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa tus credenciales para acceder al inventario
          </p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-danger/10 p-4 text-sm font-medium text-danger">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
                placeholder="natalia@ejemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
              Contraseña
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Key className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              "Verificando..."
            ) : (
              <>
                Entrar al sistema
                <LogIn className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}