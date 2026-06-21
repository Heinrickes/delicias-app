"use client";

import { useRouter } from "next/navigation";

type MesOpt = { value: string; label: string };

export function MesSelector({
  value,
  meses,
}: {
  value: string;
  meses: MesOpt[];
}) {
  const router = useRouter();
  return (
    <select
      value={value}
      onChange={(e) => router.push(`/?mes=${e.target.value}`)}
      aria-label="Filtrar por mes"
      className="h-9 rounded-lg border border-input bg-card px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {meses.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
