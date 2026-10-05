import { EvolucionMensual } from "@/dominio/servicios/CalculadoraEvolucionMensual";
import { FranjaHoraria } from "@/dominio/entidades/FranjaHoraria";
import { formatearNumero, nombreDelMes } from "../utilidades/formato";

interface Propiedades {
  readonly filas: readonly EvolucionMensual[];
}

const CLASES_TH =
  "border-b-2 border-rojo bg-black px-2.5 py-2 text-xs font-bold uppercase tracking-[0.06em]";
const CLASES_TD = "border-b border-divisorTabla px-2.5 py-3 text-right tabular-nums";

/** Réplica de la tabla "Evolución mensual por franja horaria" del Excel. */
export function TablaEvolucionMensual({ filas }: Propiedades) {
  const totales = filas.reduce(
    (acum, fila) => ({
      punta: acum.punta + fila.kwhPorFranja[FranjaHoraria.Punta],
      llano: acum.llano + fila.kwhPorFranja[FranjaHoraria.Llano],
      valle: acum.valle + fila.kwhPorFranja[FranjaHoraria.Valle],
      total: acum.total + fila.kwhTotal,
    }),
    { punta: 0, llano: 0, valle: 0, total: 0 },
  );

  return (
    <div className="overflow-x-auto rounded-sm border border-borde bg-superficie p-4">
      <table className="w-full min-w-[480px] border-collapse text-lg">
        <thead>
          <tr>
            <th className={`${CLASES_TH} text-left text-textoMuted`}>Mes</th>
            <th className={`${CLASES_TH} text-rojo`}>Punta (kWh)</th>
            <th className={`${CLASES_TH} text-textoMuted`}>Llano (kWh)</th>
            <th className={`${CLASES_TH} text-textoMuted`}>Valle (kWh)</th>
            <th className={`${CLASES_TH} text-textoMuted`}>Total (kWh)</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={`${fila.anio}-${fila.mes}`}>
              <td className="border-b border-divisorTabla px-2.5 py-3 font-semibold text-white">
                {nombreDelMes(fila.mes)}
              </td>
              <td className={CLASES_TD}>{formatearNumero(fila.kwhPorFranja[FranjaHoraria.Punta])}</td>
              <td className={CLASES_TD}>{formatearNumero(fila.kwhPorFranja[FranjaHoraria.Llano])}</td>
              <td className={CLASES_TD}>{formatearNumero(fila.kwhPorFranja[FranjaHoraria.Valle])}</td>
              <td className={`${CLASES_TD} text-white`}>{formatearNumero(fila.kwhTotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-black font-bold text-white">
            <td className="px-2.5 py-3">TOTAL</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.punta)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.llano)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.valle)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
