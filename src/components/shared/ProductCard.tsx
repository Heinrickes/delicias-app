"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
};

export function ProductCard({ producto }: { producto: Producto }) {
  // Estados originales
  const [stock, setStock] = useState(producto.stock);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // NUEVOS ESTADOS PARA EDICIÓN
  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState(producto.nombre);
  const [editPrecio, setEditPrecio] = useState(producto.precio.toString());
  const [isSaving, setIsSaving] = useState(false);
  
  const router = useRouter();

  // 1. Función de Venta (sin cambios)
  const handleVender = async () => {
    if (stock <= 0) return; 
    setLoading(true);

    const nuevoStock = stock - 1;

    const { error: updateError } = await supabase
      .from("productos")
      .update({ stock: nuevoStock })
      .eq("id", producto.id);

    if (!updateError) {
      const { error: insertError } = await supabase
        .from("ventas")
        .insert([{
            producto_id: producto.id,
            nombre_producto: producto.nombre,
            cantidad: 1,
            total: producto.precio
        }]);

      if (!insertError) {
        setStock(nuevoStock); 
      } else {
        console.error("Error guardando historial:", insertError);
      }
    }
    setLoading(false);
  };

  // 2. Función de Borrado (sin cambios)
  const handleBorrar = async () => {
    const confirmar = window.confirm(`¿Seguro que deseas eliminar "${producto.nombre}"?`);
    if (!confirmar) return;

    setIsDeleting(true);
    const { error } = await supabase.from("productos").update({ activo: false }).eq("id", producto.id);

    if (!error) {
      router.refresh(); 
    } else {
      setIsDeleting(false);
    }
  };

  // 3. NUEVA FUNCIÓN: Guardar Edición
  const handleGuardarEdicion = async () => {
    setIsSaving(true);
    
    const { error } = await supabase
      .from("productos")
      .update({
        nombre: editNombre,
        precio: parseInt(editPrecio)
      })
      .eq("id", producto.id);

    if (!error) {
      setIsEditing(false); // Apagamos el modo edición
      router.refresh();    // Refrescamos la pantalla con los datos nuevos
    } else {
      console.error("Error al editar:", error);
      alert("No se pudo actualizar el producto.");
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-brand-verde flex flex-col justify-between relative min-h-[200px]">
      
      {/* BOTONES SUPERIORES (Lápiz y Basurero) */}
      <div className="absolute top-4 right-4 flex gap-3">
        <button 
          onClick={() => setIsEditing(!isEditing)}
          title="Editar producto"
          className="text-gray-300 hover:text-brand-dorado transition-colors"
        >
          ✏️
        </button>
        <button 
          onClick={handleBorrar}
          disabled={isDeleting}
          title="Eliminar producto"
          className="text-gray-300 hover:text-red-500 transition-colors"
        >
          {isDeleting ? "..." : "🗑️"}
        </button>
      </div>

      {/* RENDERIZADO CONDICIONAL: Muestra cajas de texto si está editando, si no, muestra texto normal */}
      {isEditing ? (
        <div className="mt-2 pr-16">
          <input
            type="text"
            value={editNombre}
            onChange={(e) => setEditNombre(e.target.value)}
            className="w-full p-2 mb-2 border-2 rounded border-brand-dorado text-brand-chocolate focus:outline-none font-bold"
          />
          <div className="flex gap-2 mb-4">
            <span className="p-2 bg-gray-100 rounded text-gray-600 font-bold">$</span>
            <input
              type="number"
              value={editPrecio}
              onChange={(e) => setEditPrecio(e.target.value)}
              className="w-full p-2 border-2 rounded border-brand-dorado text-brand-chocolate focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGuardarEdicion}
              disabled={isSaving}
              className="bg-brand-dorado text-white text-sm px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-all"
            >
              {isSaving ? "Guardando..." : "Guardar ✔️"}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditNombre(producto.nombre); // Restaurar si cancela
                setEditPrecio(producto.precio.toString());
              }}
              className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition-all"
            >
              Cancelar ✖️
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold text-brand-chocolate mb-2 pr-16 leading-tight">{producto.nombre}</h2>
          <div className="flex justify-between items-center mt-4">
            <span className="text-lg font-medium text-gray-700">
              ${producto.precio.toLocaleString("es-CL")}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold transition-colors ${
              stock < 10 ? "bg-red-100 text-red-600" : "bg-brand-crema text-brand-chocolate"
            }`}>
              Stock: {stock}
            </span>
          </div>
        </div>
      )}
      
      <button
        onClick={handleVender}
        disabled={loading || stock <= 0 || isEditing}
        className={`mt-6 w-full py-3 rounded-lg font-bold transition-all ${
          stock <= 0 || isEditing
            ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
            : "bg-brand-verde text-white hover:bg-opacity-90 active:scale-95 shadow-md"
        }`}
      >
        {loading ? "Procesando..." : stock <= 0 ? "Agotado" : "Registrar Venta"}
      </button>
    </div>
  );
}