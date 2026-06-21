"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StockMovimientoDialog } from "@/components/shared/StockMovimientoDialog";
import { formatMoneda } from "@/lib/constants";

export type ProductoInventario = {
  id: string;
  nombre: string;
  categoria: string | null;
  stock: number;
  stock_minimo: number;
  costo: number;
  unidad: string;
};

type Orden = "nombre" | "stock_asc" | "stock_desc" | "valor_desc";

const selectClass =
  "h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function InventarioTabla({
  productos,
}: {
  productos: ProductoInventario[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<Orden>("nombre");

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const arr = productos.filter(
      (p) =>
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        (p.categoria ?? "").toLowerCase().includes(q)
    );
    const valor = (p: ProductoInventario) => p.costo * p.stock;
    return [...arr].sort((a, b) => {
      switch (orden) {
        case "stock_asc":
          return a.stock - b.stock;
        case "stock_desc":
          return b.stock - a.stock;
        case "valor_desc":
          return valor(b) - valor(a);
        default:
          return a.nombre.localeCompare(b.nombre);
      }
    });
  }, [productos, busqueda, orden]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Inventario ({filtrados.length})
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar…"
              className="h-9 w-40 pl-8 sm:w-52"
            />
          </div>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            className={selectClass}
            aria-label="Ordenar inventario"
          >
            <option value="nombre">Nombre</option>
            <option value="stock_asc">Menos stock</option>
            <option value="stock_desc">Más stock</option>
            <option value="valor_desc">Mayor valor</option>
          </select>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          No hay productos que coincidan.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Producto</th>
                  <th className="px-5 py-3 font-semibold">Categoría</th>
                  <th className="px-5 py-3 text-center font-semibold">Stock</th>
                  <th className="px-5 py-3 text-right font-semibold">Valor</th>
                  <th className="px-5 py-3 text-center font-semibold">Estado</th>
                  <th className="px-5 py-3 text-right font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtrados.map((p) => {
                  const agotado = p.stock <= 0;
                  const bajo = p.stock < p.stock_minimo;
                  return (
                    <tr key={p.id} className="hover:bg-background/30">
                      <td className="px-5 py-3 font-medium text-foreground">
                        {p.nombre}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {p.categoria ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-center tabular-nums">
                        {p.stock}{" "}
                        <span className="text-xs text-muted-foreground">
                          {p.unidad}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                        {formatMoneda(p.costo * p.stock)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge
                          className={
                            agotado
                              ? "bg-danger/15 text-danger"
                              : bajo
                                ? "bg-gold/15 text-gold"
                                : "bg-success/15 text-success"
                          }
                        >
                          {agotado ? "Agotado" : bajo ? "Bajo" : "OK"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <StockMovimientoDialog producto={p} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
