"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoneda } from "@/lib/constants";

const ejeStyle = { fontSize: 11, fill: "var(--muted-foreground)" };

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "12px",
  color: "var(--popover-foreground)",
};

export function VentasChart({
  data,
}: {
  data: { dia: string; ingresos: number; costos: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="dia" tick={ejeStyle} tickLine={false} axisLine={false} />
        <YAxis tick={ejeStyle} tickLine={false} axisLine={false} width={48} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, name) => [
            formatMoneda(Number(value)),
            name === "ingresos" ? "Ingresos" : "Costos",
          ]}
        />
        <Area
          type="monotone"
          dataKey="ingresos"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#gIngresos)"
        />
        <Area
          type="monotone"
          dataKey="costos"
          stroke="var(--chart-4)"
          strokeWidth={2}
          fill="transparent"
          strokeDasharray="4 4"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const barColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function TopProductosChart({
  data,
}: {
  data: { nombre: string; unidades: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={ejeStyle} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="nombre"
          tick={ejeStyle}
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          formatter={(value) => [`${Number(value)} u.`, "Vendidas"]}
        />
        <Bar dataKey="unidades" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={barColors[i % barColors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProduccionChart({
  data,
}: {
  data: { dia: string; cantidad: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="dia" tick={ejeStyle} tickLine={false} axisLine={false} />
        <YAxis tick={ejeStyle} tickLine={false} axisLine={false} width={36} />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          formatter={(value) => [`${Number(value)} u.`, "Producción"]}
        />
        <Bar dataKey="cantidad" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
