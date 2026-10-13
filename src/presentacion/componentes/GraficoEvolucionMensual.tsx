import { EvolucionMensual } from "@/dominio/servicios/CalculadoraEvolucionMensual";
import { FranjaHoraria } from "@/dominio/entidades/FranjaHoraria";
import { formatearNumero, nombreDelMes } from "../utilidades/formato";
import { COLOR_CSS_POR_FRANJA } from "../utilidades/colorPorFranja";

interface Propiedades {
  readonly filas: readonly EvolucionMensual[];
}

// De arriba hacia abajo en la barra apilada: Valle (arriba) → Llano → Punta (abajo).
// Así Punta queda apoyada en la base, igual que el orden de apilado anterior.
const ORDEN_APILADO: readonly FranjaHoraria[] = [
  FranjaHoraria.Valle,
  FranjaHoraria.Llano,
  FranjaHoraria.Punta,
];

// Para la leyenda: mismo orden que el gráfico de kWh por franja.
const ORDEN_LEYENDA: readonly FranjaHoraria[] = [
  FranjaHoraria.Punta,
  FranjaHoraria.Llano,
  FranjaHoraria.Valle,
];

const ALTO_MAXIMO_BARRA_PX = 170;

/**
 * Barras apiladas por mes, con el mismo lenguaje visual que `GraficoBarrasKwhFranja`
 * (barras de color hechas a mano, total arriba, sin ejes ni grilla). Cada mes es una
 * columna; cada franja, un segmento de color dentro de la columna.
 */
export function GraficoEvolucionMensual({ filas }: Propiedades) {
  const titulo = (
    <div className="text-[13px] font-bold uppercase tracking-[0.1em] text-textoMuted">
      Evolución mensual por franja
    </div>
  );

  if (filas.length === 0) {
    return (
      <div className="flex flex-col gap-2.5 rounded-sm border border-borde bg-superficie p-4">
        {titulo}
        <div className="flex h-[220px] items-center justify-center text-center text-sm text-textoMuted">
          Todavía no hay historial suficiente para mostrar una evolución mensual.
        </div>
      </div>
    );
  }

  const maximo = Math.max(...filas.map((f) => f.kwhTotal), 1);

  return (
    <div className="flex flex-col gap-2.5 rounded-sm border border-borde bg-superficie p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {titulo}
        <div className="flex flex-wrap gap-3">
          {ORDEN_LEYENDA.map((franja) => (
            <span key={franja} className="flex items-center gap-1.5 text-xs text-textoMuted">
              <span
                className="inline-block h-2.5 w-2.5 rounded-[1px]"
                style={{ backgroundColor: COLOR_CSS_POR_FRANJA[franja], opacity: 0.9 }}
              />
              {franja}
            </span>
          ))}
        </div>
      </div>

      <div className="flex h-[220px] items-end gap-4 border-b border-bordeFuerte px-5">
        {filas.map((fila) => (
          <div
            key={`${fila.anio}-${fila.mes}`}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
          >
            <div className="tabular-nums text-base text-white">{formatearNumero(fila.kwhTotal)}</div>
            <div className="flex w-full max-w-[120px] flex-col">
              {ORDEN_APILADO.map((franja) => (
                <div
                  key={franja}
                  style={{
                    height: `${(fila.kwhPorFranja[franja] / maximo) * ALTO_MAXIMO_BARRA_PX}px`,
                    backgroundColor: COLOR_CSS_POR_FRANJA[franja],
                    opacity: 0.9,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 px-5">
        {filas.map((fila) => (
          <div key={`${fila.anio}-${fila.mes}`} className="flex flex-1 flex-col items-center">
            <span className="tabular-nums text-xs text-textoMuted">
              {nombreDelMes(fila.mes)} {fila.anio}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
