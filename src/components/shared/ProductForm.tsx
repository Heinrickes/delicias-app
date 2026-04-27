"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function ProductForm() {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("productos")
      .insert([
        {
          nombre: nombre,
          precio: parseInt(precio),
          stock: parseInt(stock),
          categoria: "Nuevo Ingreso"
        }
      ]);

    if (!error) {
      setNombre("");
      setPrecio("");
      setStock("");
      router.refresh(); 
    } else {
      console.error("Error al crear producto:", error);
      alert("Hubo un error al guardar el producto.");
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-brand-chocolate p-6 rounded-xl shadow-lg mb-8 text-brand-crema">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>+</span> Agregar Nuevo Producto
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Nombre del Chocolate/Alfajor</label>
          {/* Aquí agregamos bg-white */}
          <input 
            type="text" 
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2 rounded bg-white text-brand-chocolate focus:outline-none focus:ring-2 focus:ring-brand-dorado"
            placeholder="Ej: Alfajor de Nuez..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Precio ($)</label>
          {/* Aquí agregamos bg-white */}
          <input 
            type="number" 
            required
            min="0"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="w-full p-2 rounded bg-white text-brand-chocolate focus:outline-none focus:ring-2 focus:ring-brand-dorado"
            placeholder="Ej: 1500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stock Inicial</label>
          <div className="flex gap-2">
            {/* Aquí agregamos bg-white */}
            <input 
              type="number" 
              required
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full p-2 rounded bg-white text-brand-chocolate focus:outline-none focus:ring-2 focus:ring-brand-dorado"
              placeholder="Ej: 12"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-brand-verde hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded transition-all disabled:opacity-50"
            >
              {loading ? "..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}