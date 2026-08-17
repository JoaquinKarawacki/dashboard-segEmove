import { DistribucionFranja } from "@/dominio/servicios/CalculadoraKpis";
import { formatearNumero, formatearPorcentaje, formatearUsd, formatearUyu } from "../utilidades/formato";
import { COLOR_CSS_POR_FRANJA } from "../utilidades/colorPorFranja";

interface Propiedades {
  readonly filas: readonly DistribucionFranja[];
}

/** Réplica de la tabla "Distribución por franja horaria" del Excel. */
export function TablaDistribucionFranja({ filas }: Propiedades) {
  const totales = {
    kwh: filas.reduce((suma, fila) => suma + fila.kwhVendidos, 0),
    uyu: filas.reduce((suma, fila) => suma + fila.ingresoUyu, 0),
    usd: filas.reduce((suma, fila) => suma + fila.ingresoUsd, 0),
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-borde">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-borde text-left text-textoSecundario">
            <th className="px-4 py-2">Franja horaria</th>
            <th className="px-4 py-2 text-right">kWh vendidos</th>
            <th className="px-4 py-2 text-right">Ingreso (UYU)</th>
            <th className="px-4 py-2 text-right">Ingreso (USD)</th>
            <th className="px-4 py-2 text-right">% del total kWh</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.franjaHoraria} className="border-b border-grilla last:border-0">
              <td className="px-4 py-2">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLOR_CSS_POR_FRANJA[fila.franjaHoraria] }}
                    aria-hidden
                  />
                  {fila.franjaHoraria}
                </span>
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{formatearNumero(fila.kwhVendidos)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatearUyu(fila.ingresoUyu)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatearUsd(fila.ingresoUsd)}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {formatearPorcentaje(fila.porcentajeDelTotalKwh)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-borde font-medium">
            <td className="px-4 py-2">Total</td>
            <td className="px-4 py-2 text-right tabular-nums">{formatearNumero(totales.kwh)}</td>
            <td className="px-4 py-2 text-right tabular-nums">{formatearUyu(totales.uyu)}</td>
            <td className="px-4 py-2 text-right tabular-nums">{formatearUsd(totales.usd)}</td>
            <td className="px-4 py-2 text-right tabular-nums">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
