import { FranjaHoraria } from "../entidades/FranjaHoraria";
import { RangoFechas, fechaEstaDentroDelRango } from "../entidades/RangoFechas";
import { Transaccion } from "../entidades/Transaccion";

/**
 * Filtro equivalente a los criterios de los SUMIFS/COUNTIFS del Excel:
 * cargador + rango de fechas + franja horaria opcional. `franjaHoraria: null`
 * equivale a la opción "Todas" del dropdown del Excel (no filtra por franja).
 */
export interface FiltroTransacciones {
  readonly codigoEstacion: string;
  readonly rango: RangoFechas;
  readonly franjaHoraria: FranjaHoraria | null;
}

/** Una transacción excluida manualmente (columna "Excluir" del Excel) nunca entra en ningún cálculo. */
export function transaccionCumpleFiltro(transaccion: Transaccion, filtro: FiltroTransacciones): boolean {
  if (transaccion.excluir) return false;
  if (transaccion.cargador !== filtro.codigoEstacion) return false;
  if (!fechaEstaDentroDelRango(transaccion.fechaInicio, filtro.rango)) return false;
  if (filtro.franjaHoraria !== null && transaccion.franjaHoraria !== filtro.franjaHoraria) return false;
  return true;
}

export function filtrarTransacciones(
  transacciones: readonly Transaccion[],
  filtro: FiltroTransacciones,
): Transaccion[] {
  return transacciones.filter((transaccion) => transaccionCumpleFiltro(transaccion, filtro));
}
