import { DashboardEstacion } from "@/aplicacion/casosDeUso/ObtenerDashboardEstacionCasoUso";
import { formatearNumero } from "../utilidades/formato";
import { Alcance } from "./ScopePills";
import { COLOR_CSS_POR_FRANJA } from "../utilidades/colorPorFranja";
import { FranjaHoraria } from "@/dominio/entidades/FranjaHoraria";

interface Propiedades {
  readonly dashboards: readonly DashboardEstacion[];
  readonly alcance: Alcance;
}

const CLASES_TH =
  "border-b-2 border-rojo bg-black px-2.5 py-2 text-xs font-bold uppercase tracking-[0.06em] text-textoMuted";
const CLASES_TD = "border-b border-divisorTabla px-2.5 py-3 text-right tabular-nums";

// Mismo swatch por posición que el resto del dashboard (Punta/Llano/Valle → rojo/gris/gris).
const COLORES_CARGADOR = [
  COLOR_CSS_POR_FRANJA[FranjaHoraria.Punta],
  COLOR_CSS_POR_FRANJA[FranjaHoraria.Llano],
  COLOR_CSS_POR_FRANJA[FranjaHoraria.Valle],
];

/** Réplica de la tabla "Resultados — Costo UTE y margen por cargador" del Excel. */
export function TablaCostoUteResumen({ dashboards, alcance }: Propiedades) {
  const maxAbsMargen = Math.max(...dashboards.map((d) => Math.abs(d.margen.margenNetoUyu)), 1);

  const totales = dashboards.reduce(
    (acum, d) => ({
      ingreso: acum.ingreso + d.kpis.ingresoTotalUyu,
      ute: acum.ute + d.margen.costoTotalUte,
      eve: acum.eve + d.margen.costoGestionEve,
      sim: acum.sim + d.margen.costoSim4g,
      margen: acum.margen + d.margen.margenNetoUyu,
    }),
    { ingreso: 0, ute: 0, eve: 0, sim: 0, margen: 0 },
  );

  return (
    <div className="overflow-x-auto rounded-sm border border-borde bg-superficie p-4">
      <table className="w-full min-w-[1000px] border-collapse text-lg">
        <thead>
          <tr>
            <th className={`${CLASES_TH} text-left`}>Cargador</th>
            <th className={CLASES_TH}>Ingreso período (UYU)</th>
            <th className={CLASES_TH}>Costo UTE</th>
            <th className={CLASES_TH}>Gestión EVE (12 %)</th>
            <th className={CLASES_TH}>SIM 4G</th>
            <th className={`${CLASES_TH} w-[260px] text-left`}>Margen neto (UYU)</th>
            <th className={`${CLASES_TH} text-left`}>Última transacción</th>
          </tr>
        </thead>
        <tbody>
          {dashboards.map((d, indice) => {
            const activa = alcance === "todos" || alcance === d.estacion.codigo;
            const negativo = d.margen.margenNetoUyu < 0;
            return (
              <tr key={d.estacion.codigo} className={activa ? "" : "opacity-40"}>
                <td className="border-b border-divisorTabla px-2.5 py-3 font-semibold text-white">
                  <span className="inline-flex items-center gap-2.5">
                    <span className="inline-block h-2.5 w-2.5" style={{ backgroundColor: COLORES_CARGADOR[indice] }} aria-hidden />
                    {d.estacion.nombre}
                  </span>
                </td>
                <td className={CLASES_TD}>{formatearNumero(d.kpis.ingresoTotalUyu)}</td>
                <td className={CLASES_TD}>{formatearNumero(d.margen.costoTotalUte)}</td>
                <td className={CLASES_TD}>{formatearNumero(d.margen.costoGestionEve)}</td>
                <td className={CLASES_TD}>{formatearNumero(d.margen.costoSim4g)}</td>
                <td className="border-b border-divisorTabla px-2.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-3.5 flex-1 overflow-hidden bg-borde">
                      <div
                        className="h-full"
                        style={{
                          width: `${(Math.abs(d.margen.margenNetoUyu) / maxAbsMargen) * 100}%`,
                          backgroundColor: negativo ? "var(--color-rojo)" : "#ffffff",
                        }}
                      />
                    </div>
                    <span className={`min-w-[80px] text-right font-semibold tabular-nums ${negativo ? "text-rojo" : "text-white"}`}>
                      {formatearNumeroConSigno(d.margen.margenNetoUyu)}
                    </span>
                  </div>
                </td>
                <td className="border-b border-divisorTabla px-2.5 py-3 text-left tabular-nums text-textoSecundario">
                  {formatearFechaHora(d.ultimaTransaccion)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-black font-bold text-white">
            <td className="px-2.5 py-3">TOTAL</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.ingreso)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.ute)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.eve)}</td>
            <td className="px-2.5 py-3 text-right tabular-nums">{formatearNumero(totales.sim)}</td>
            <td className={`px-2.5 py-3 text-right tabular-nums ${totales.margen < 0 ? "text-rojo" : "text-white"}`}>
              {formatearNumeroConSigno(totales.margen)}
            </td>
            <td className="px-2.5 py-3" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function formatearNumeroConSigno(valor: number): string {
  return `${valor < 0 ? "−" : ""}${formatearNumero(Math.abs(valor))}`;
}

function formatearFechaHora(iso: string | null): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  const dd = String(fecha.getDate()).padStart(2, "0");
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const yyyy = fecha.getFullYear();
  const hh = String(fecha.getHours()).padStart(2, "0");
  const mi = String(fecha.getMinutes()).padStart(2, "0");
  const ss = String(fecha.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
}
