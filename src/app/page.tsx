import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ProductCard } from "@/components/shared/ProductCard";
import { ProductForm } from "@/components/shared/ProductForm";
import { ArrowRight, Package } from "lucide-react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { UserNav } from "@/components/shared/UserNav";

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
};

async function getProductos() {
  const { data: productos, error } = await supabase
    .from("productos")
    .select("id, nombre, precio, stock")
    .eq("activo", true)
    .order("nombre");

  if (error) console.error("Error trayendo productos:", error);
  return (productos ?? []) as Producto[];
}

export default async function Home() {
  const cookieStore = await cookies();
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const productos = await getProductos();
  const totalStock = productos.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = productos.filter((p) => p.stock < 10).length;

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <Package className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Delicias Caseras
                </h1>
                <p className="text-sm text-muted">Inventario</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/ventas"
                className="group inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Ver historial de ventas
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <UserNav email={user?.email} />
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Productos
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {productos.length}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Stock Total
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {totalStock}
            </p>
          </div>
          <div className="col-span-2 rounded-xl border bg-card p-4 sm:col-span-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Stock Bajo
            </p>
            <p
              className={`mt-1 text-2xl font-semibold tabular-nums ${
                lowStockCount > 0 ? "text-danger" : "text-success"
              }`}
            >
              {lowStockCount}
            </p>
          </div>
        </div>

        {/* Add Product Form */}
        <ProductForm />

        {/* Products Grid */}
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
            Productos ({productos.length})
          </h2>
          {productos.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-12 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted">
                No hay productos en el inventario
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Agrega tu primer producto usando el formulario de arriba
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {productos.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}