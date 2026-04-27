import { supabase } from "@/lib/supabase";
import Link from "next/link";

// Le decimos a Next.js que no guarde esto en caché, para ver siempre las ventas nuevas al instante
export const revalidate = 0;

async function getVentas() {
  const { data: ventas, error } = await supabase
    .from("ventas")
    .select("*")
    .order("fecha", { ascending: false }); // Las ventas más nuevas arriba

  if (error) console.error("Error trayendo ventas:", error);
  return ventas || [];
}

export default async function VentasPage() {
  const ventas = await getVentas();
  
  // Magia de JavaScript: Sumamos todos los totales para saber la recaudación
  const totalIngresos = ventas.reduce((suma, venta) => suma + venta.total, 0);

  return (
    <main className="min-h-screen bg-brand-crema p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabecera con botón para volver */}
        <div className="flex justify-between items-center mb-8 border-b-2 border-brand-dorado pb-4">
          <h1 className="text-4xl font-bold text-brand-chocolate">
            Historial de Ventas
          </h1>
          <Link href="/" className="bg-brand-verde text-white px-6 py-3 rounded-lg font-bold shadow-md hover:opacity-90 transition-all">
            ← Volver al Inventario
          </Link>
        </div>

        {/* Tarjeta de Resumen Financiero */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 border-l-8 border-brand-dorado flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-600">Total Recaudado</h2>
          <span className="text-3xl font-extrabold text-brand-verde">
            ${totalIngresos.toLocaleString("es-CL")}
          </span>
        </div>

        {/* Tabla de Ventas */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-brand-chocolate/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-chocolate text-brand-crema">
                <th className="p-4 font-semibold">Fecha y Hora</th>
                <th className="p-4 font-semibold">Producto</th>
                <th className="p-4 font-semibold text-center">Cant.</th>
                <th className="p-4 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta) => (
                <tr key={venta.id} className="border-b last:border-0 hover:bg-brand-crema/30 transition-colors">
                  <td className="p-4 text-gray-500 text-sm">
                    {new Date(venta.fecha).toLocaleString('es-CL')}
                  </td>
                  <td className="p-4 font-bold text-brand-chocolate">{venta.nombre_producto}</td>
                  <td className="p-4 text-center text-gray-600">{venta.cantidad}</td>
                  <td className="p-4 text-right font-bold text-brand-verde">
                    ${venta.total.toLocaleString("es-CL")}
                  </td>
                </tr>
              ))}
              
              {ventas.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                    Aún no hay ventas registradas. ¡A vender esos alfajores!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}