"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EvolucionMensual } from "@/dominio/servicios/CalculadoraEvolucionMensual";
import { FranjaHoraria } from "@/dominio/entidades/FranjaHoraria";
import { formatearNumero, nombreDelMes } from "../utilidades/formato";
import { COLOR_HEX_POR_FRANJA } from "../utilidades/colorPorFranja";

interface Propiedades {
  readonly filas: readonly EvolucionMensual[];
}

/** Barras apiladas por mes: cada franja es su propia serie categórica (nunca se ciclan los colores). */
export function GraficoEvolucionMensual({ filas }: Propiedades) {
  if (filas.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-textoMuted">
        Todavía no hay historial suficiente para mostrar una evolución mensual.
      </div>
    );
  }

  const datos = filas.map((fila) => ({
    mes: `${nombreDelMes(fila.mes)} ${fila.anio}`,
    [FranjaHoraria.Punta]: fila.kwhPorFranja[FranjaHoraria.Punta],
    [FranjaHoraria.Llano]: fila.kwhPorFranja[FranjaHoraria.Llano],
    [FranjaHoraria.Valle]: fila.kwhPorFranja[FranjaHoraria.Valle],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={datos}>
        <CartesianGrid vertical={false} stroke="var(--color-grilla)" />
        <XAxis dataKey="mes" stroke="var(--color-texto-muted)" fontSize={12} />
        <YAxis stroke="var(--color-texto-muted)" fontSize={12} />
        <Tooltip
          formatter={(valor: number) => `${formatearNumero(valor)} kWh`}
          contentStyle={{
            backgroundColor: "var(--color-superficie)",
            borderColor: "var(--color-borde)",
            color: "var(--color-texto)",
          }}
        />
        <Legend />
        <Bar dataKey={FranjaHoraria.Punta} stackId="franjas" fill={COLOR_HEX_POR_FRANJA.Punta} radius={[0, 0, 0, 0]} />
        <Bar dataKey={FranjaHoraria.Llano} stackId="franjas" fill={COLOR_HEX_POR_FRANJA.Llano} />
        <Bar dataKey={FranjaHoraria.Valle} stackId="franjas" fill={COLOR_HEX_POR_FRANJA.Valle} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
