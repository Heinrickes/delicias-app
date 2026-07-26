/** Iniciales (máx. 2 letras) a partir del nombre de un perfil, para HistorialTimeline. */
export function inicialesDe(nombre?: string | null): string | undefined {
  if (!nombre) return undefined;
  const iniciales = nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return iniciales || undefined;
}

/** Agrupa una lista de eventos con fecha en chips Hoy / Esta semana / Anteriores, para HistorialTimeline. */
export function agruparPorPeriodo<T extends { fecha: string }>(eventos: T[]) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - 7);

  const buckets: { hoy: T[]; semana: T[]; anteriores: T[] } = {
    hoy: [],
    semana: [],
    anteriores: [],
  };

  for (const e of eventos) {
    const f = new Date(e.fecha);
    if (f >= hoy) buckets.hoy.push(e);
    else if (f >= inicioSemana) buckets.semana.push(e);
    else buckets.anteriores.push(e);
  }

  return [
    { key: "hoy", label: "Hoy", items: buckets.hoy },
    { key: "semana", label: "Esta semana", items: buckets.semana },
    { key: "anteriores", label: "Anteriores", items: buckets.anteriores },
  ].filter((b) => b.items.length > 0);
}
