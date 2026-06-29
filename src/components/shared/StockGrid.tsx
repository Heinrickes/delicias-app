"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { StockMovimientoDialog } from "@/components/shared/StockMovimientoDialog";
import { FilterBar } from "@/components/shared/FilterBar";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Badge } from "@/components/ui/badge";
import { formatMoneda } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Producto = {
  id: string;
  nombre: string;
  categoria: string | null;
  stock: number;
  stock_minimo: number;
  costo: number;
  unidad: string;
};

function estadoBadge(agotado: boolean, bajo: boolean) {
  if (agotado) return <Badge className="shrink-0 bg-danger/15 text-[10px] text-danger">Agotado</Badge>;
  if (bajo) return <Badge className="shrink-0 bg-gold/15 text-[10px] text-gold">Bajo</Badge>;
  return <Badge className="shrink-0 bg-success/15 text-[10px] text-success">OK</Badge>;
}

function BarraProgreso({ stock, minimo, agotado, bajo }: { stock: number; minimo: number; agotado: boolean; bajo: boolean }) {
  const pct = Math.min(100, Math.round((stock / Math.max(minimo, 1)) * 100));
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", agotado ? "bg-danger" : bajo ? "bg-gold" : "bg-success")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function InsumoCard({ producto }: { producto: Producto }) {
  const agotado = producto.stock <= 0;
  const bajo = !agotado && producto.stock < producto.stock_minimo;

  return (
    <CollapsibleCard
      icon={<Package className="h-4 w-4" />}
      title={producto.nombre}
      badge={estadoBadge(agotado, bajo)}
      subtitle={
        <span>
          {producto.stock} {producto.unidad} · {formatMoneda(producto.costo * producto.stock)}
        </span>
      }
      fields={[
        { label: "Stock actual", value: `${producto.stock} ${producto.unidad}` },
        { label: "Stock mínimo", value: `${producto.stock_minimo} ${producto.unidad}` },
        { label: "Valor en stock", value: formatMoneda(producto.costo * producto.stock) },
        ...(producto.categoria ? [{ label: "Categoría", value: producto.categoria }] : []),
      ]}
      actions={
        <StockMovimientoDialog
          producto={{ id: producto.id, nombre: producto.nombre, stock: producto.stock, stock_minimo: producto.stock_minimo }}
          trigger={
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Reponer / Ajustar
            </button>
          }
        />
      }
    >
      <BarraProgreso stock={producto.stock} minimo={producto.stock_minimo} agotado={agotado} bajo={bajo} />
    </CollapsibleCard>
  );
}

export function StockGrid({ productos }: { productos: Producto[] }) {
  const [query, setQuery] = useState("");
  const [catActiva, setCatActiva] = useState<string | null>(null);

  const categorias = Array.from(
    new Set(productos.map((p) => p.categoria).filter(Boolean) as string[])
  ).sort();

  const filtrados = productos.filter((p) => {
    const matchQuery = p.nombre.toLowerCase().includes(query.toLowerCase());
    const matchCat = catActiva === null || p.categoria === catActiva;
    return matchQuery && matchCat;
  });

  return (
    <div className="space-y-3">
      <FilterBar
        placeholder="Buscar insumo..."
        categorias={categorias}
        onSearch={setQuery}
        onCategoria={setCatActiva}
      />

      {filtrados.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map((p) => (
            <InsumoCard key={p.id} producto={p} />
          ))}
        </div>
      )}
    </div>
  );
}
