"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { DistribucionFranja } from "@/dominio/servicios/CalculadoraKpis";
import { formatearNumero } from "../utilidades/formato";
import { COLOR_HEX_POR_FRANJA } from "../utilidades/colorPorFranja";

interface Propiedades {
  readonly filas: readonly DistribucionFranja[];
}

/** Gráfico de torta: identidad (franja horaria) → paleta categórica, no secuencial. */
export function GraficoDistribucionFranja({ filas }: Propiedades) {
  const datos = filas.map((fila) => ({
    nombre: fila.franjaHoraria,
    kwh: fila.kwhVendidos,
  }));

  const hayDatos = datos.some((dato) => dato.kwh > 0);
  if (!hayDatos) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-textoMuted">
        No hay energía vendida en el rango seleccionado.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={datos} dataKey="kwh" nameKey="nombre" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {datos.map((dato) => (
            <Cell key={dato.nombre} fill={COLOR_HEX_POR_FRANJA[dato.nombre]} stroke="var(--color-superficie)" />
          ))}
        </Pie>
        <Tooltip
          formatter={(valor: number) => [`${formatearNumero(valor)} kWh`, ""]}
          contentStyle={{
            backgroundColor: "var(--color-superficie)",
            borderColor: "var(--color-borde)",
            color: "var(--color-texto)",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
