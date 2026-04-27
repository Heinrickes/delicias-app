// IMPORTANTE: Asegúrate de agregar esta línea de importación bien arriba, justo debajo de 'import { ProductCard }...'
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ProductCard } from "@/components/shared/ProductCard";
import { ProductForm } from "@/components/shared/ProductForm";


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
  const productos = await getProductos();

  return (
    <main className="min-h-screen bg-brand-crema p-8">
      <div className="max-w-4xl mx-auto">
       {/* Reemplaza tu h1 actual por esto: */}
       <div className="flex justify-between items-center mb-8 border-b-2 border-brand-dorado pb-4">
          <h1 className="text-4xl font-bold text-brand-chocolate">
            Inventario Delicias Caseras
          </h1>
          <Link href="/ventas" className="bg-brand-chocolate text-brand-crema px-6 py-3 rounded-lg font-bold shadow-md hover:opacity-90 transition-all">
            Ver Libro de Ventas 📊
          </Link>
        </div>
        <ProductForm />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {productos.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
      </div>
    </main>
  );
}