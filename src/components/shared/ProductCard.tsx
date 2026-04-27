"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X, Check, ShoppingBag } from "lucide-react";

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
};

export function ProductCard({ producto }: { producto: Producto }) {
  const [stock, setStock] = useState(producto.stock);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState(producto.nombre);
  const [editPrecio, setEditPrecio] = useState(producto.precio.toString());
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

  const handleVender = async () => {
    if (stock <= 0) return;
    setLoading(true);

    const nuevoStock = stock - 1;

    const { error: updateError } = await supabase
      .from("productos")
      .update({ stock: nuevoStock })
      .eq("id", producto.id);

    if (!updateError) {
      const { error: insertError } = await supabase.from("ventas").insert([
        {
          producto_id: producto.id,
          nombre_producto: producto.nombre,
          cantidad: 1,
          total: producto.precio,
        },
      ]);

      if (!insertError) {
        setStock(nuevoStock);
      } else {
        console.error("Error guardando historial:", insertError);
      }
    }
    setLoading(false);
  };

  const handleBorrar = async () => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${producto.nombre}"?`
    );
    if (!confirmar) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from("productos")
      .update({ activo: false })
      .eq("id", producto.id);

    if (!error) {
      router.refresh();
    } else {
      setIsDeleting(false);
    }
  };

  const handleGuardarEdicion = async () => {
    setIsSaving(true);

    const { error } = await supabase
      .from("productos")
      .update({
        nombre: editNombre,
        precio: parseInt(editPrecio),
      })
      .eq("id", producto.id);

    if (!error) {
      setIsEditing(false);
      router.refresh();
    } else {
      console.error("Error al editar:", error);
      alert("No se pudo actualizar el producto.");
    }
    setIsSaving(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditNombre(producto.nombre);
    setEditPrecio(producto.precio.toString());
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
      {/* Action buttons */}
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => setIsEditing(!isEditing)}
          title="Editar producto"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={handleBorrar}
          disabled={isDeleting}
          title="Eliminar producto"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editNombre}
            onChange={(e) => setEditNombre(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors focus:border-accent"
            placeholder="Nombre del producto"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">$</span>
            <input
              type="number"
              value={editPrecio}
              onChange={(e) => setEditPrecio(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
              placeholder="Precio"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleGuardarEdicion}
              disabled={isSaving}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
            <button
              onClick={cancelEdit}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted-foreground/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <h3 className="pr-16 text-base font-medium leading-snug text-foreground">
              {producto.nombre}
            </h3>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                ${producto.precio.toLocaleString("es-CL")}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  stock < 10
                    ? "bg-danger/10 text-danger"
                    : "bg-success/10 text-success"
                }`}
              >
                {stock} en stock
              </span>
            </div>
          </div>

          <button
            onClick={handleVender}
            disabled={loading || stock <= 0 || isEditing}
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              stock <= 0
                ? "cursor-not-allowed bg-muted-foreground/10 text-muted-foreground"
                : "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            {loading ? "Procesando..." : stock <= 0 ? "Agotado" : "Registrar Venta"}
          </button>
        </>
      )}
    </div>
  );
}
