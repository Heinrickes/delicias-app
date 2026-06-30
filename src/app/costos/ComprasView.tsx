"use client";

import { useState } from "react";
import { ShoppingCart, Plus, Boxes, Coins } from "lucide-react";
import { TiendaCompra, type InsumoTienda } from "@/components/shared/TiendaCompra";
import { CostosManager, InsumoFormDialog, type Insumo } from "@/components/shared/CostosManager";
import { formatMoneda } from "@/lib/constants";

export function ComprasView({
  insumos,
  insumosParaTienda,
  valor,
  porComprar,
}: {
  insumos: Insumo[];
  insumosParaTienda: InsumoTienda[];
  valor: number;
  porComprar: number;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Despensa
          </p>
          <h2 className="mt-1 font-serif text-3xl leading-tight text-foreground">
            Compras
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tu despensa: compra insumos y controla tu stock.
          </p>
        </div>
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-terracotta/10"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta text-white shadow">
              <ShoppingCart className="h-6 w-6" />
            </span>
            <span className="text-[11px] font-semibold text-terracotta">Tu compra</span>
          </button>
          <InsumoFormDialog
            trigger={
              <button
                type="button"
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-primary/10"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  <Plus className="h-6 w-6" />
                </span>
                <span className="text-[11px] font-semibold text-primary">Agregar insumo</span>
              </button>
            }
          />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric label="Insumos" value={insumos.length.toString()} icon={<Boxes className="h-4 w-4" />} />
        <Metric
          label="Valor en despensa"
          value={formatMoneda(valor)}
          icon={<Coins className="h-4 w-4" />}
        />
        <Metric
          label="Por comprar"
          value={porComprar.toString()}
          icon={<ShoppingCart className="h-4 w-4" />}
          danger={porComprar > 0}
        />
      </section>

      <TiendaCompra
        insumos={insumosParaTienda}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      <CostosManager insumos={insumos} />
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  danger = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:p-5">
      <div className="flex items-start gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
            danger ? "bg-danger/10 text-danger" : "bg-background text-gold"
          }`}
        >
          {icon}
        </span>
        <p className="min-w-0 text-xs font-semibold uppercase leading-tight tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={`mt-3 text-2xl font-semibold tabular-nums ${
          danger ? "text-danger" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
