import { DistribucionFranja } from "@/dominio/servicios/CalculadoraKpis";
import { formatearNumero, formatearPorcentaje, formatearUsd, formatearUyu } from "../utilidades/formato";
import { COLOR_CSS_POR_FRANJA } from "../utilidades/colorPorFranja";

interface Propiedades {
  readonly filas: readonly DistribucionFranja[];
}

const CLASES_TH =
  "border-b-2 border-rojo bg-black px-2.5 py-2 text-xs font-bold uppercase tracking-[0.06em] text-textoMuted";
const CLASES_TD = "border-b border-divisorTabla px-2.5 py-3 text-right tabular-nums";

/** Réplica de la tabla "Distribución por franja horaria" del Excel. */
export function TablaDistribucionFranja({ filas }: Propiedades) {
  const totales = {
    kwh: filas.reduce((suma, fila) => suma + fila.kwhVendidos, 0),
    uyu: filas.reduce((suma, fila) => suma + fila.ingresoUyu, 0),
    usd: filas.reduce((suma, fila) => suma + fila.ingresoUsd, 0),
  };

  return (
    <div className="overflow-x-auto rounded-sm border border-borde bg-superficie p-4">
      <table className="w-full min-w-[520px] border-collapse text-lg">
        <thead>
          <tr>
            <th className={`${CLASES_TH} text-left`}>Franja horaria</th>
            <th className={CLASES_TH}>kWh vendidos</th>
            <th className={CLASES_TH}>Ingreso (UYU)</th>
            <th className={CLASES_TH}>Ingreso (USD)</th>
            <th className={`${CLASES_TH} w-[190px] text-left`}>% del total kWh</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.franjaHoraria}>
              <td className="border-b border-divisorTabla px-2.5 py-3 font-semibold text-white">
                <span className="inline-flex items-center gap-2.5">
                  <span
                    className="inline-block h-2.5 w-2.5"
                    style={{ backgroundColor: COLOR_CSS_POR_FRANJA[fila.franjaHoraria] }}
                    aria-hidden
                  />
                  {fila.franjaHoraria}
                </span>
              </td>
              <td className={CLASES_TD}>{formatearNumero(fila.kwhVendidos)}</td>
              <td className={CLASES_TD}>{formatearUyu(fila.ingresoUyu)}</td>
              <td className={CLASES_TD}>{formatearUsd(fila.ingresoUsd)}</td>
              <td className="border-b border-divisorTabla px-2.5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-3.5 flex-1 overflow-hidden bg-borde">
                    <div
                      className="h-full"
                      style={{
                        width: `${fila.porcentajeDelTotalKwh}%`,
                        backgroundColor: COLOR_CSS_POR_FRANJA[fila.franjaHoraria],
                      }}
                    />
                  </div>
                  <span className="min-w-[62px] text-right tabular-nums">
                    {formatearPorcentaje(fila.porcentajeDelTotalKwh)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-black font-bold text-white">
            <td className="px-2.5 py-3">Total</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.kwh)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearUyu(totales.uyu)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearUsd(totales.usd)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
