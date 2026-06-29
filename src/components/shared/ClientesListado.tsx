"use client";

import { useState } from "react";
import { ClienteCard } from "@/components/shared/ClienteCard";
import { FilterBar } from "@/components/shared/FilterBar";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
};

export function ClientesListado({
  clientes,
  pedidosPorCliente,
  ventasPorCliente,
}: {
  clientes: Cliente[];
  pedidosPorCliente: Record<string, number>;
  ventasPorCliente: Record<string, number>;
}) {
  const [query, setQuery] = useState("");

  const filtrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <FilterBar placeholder="Buscar cliente..." onSearch={setQuery} />
      {filtrados.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map((cliente) => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              pedidos={pedidosPorCliente[cliente.id] ?? 0}
              totalVentas={ventasPorCliente[cliente.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
