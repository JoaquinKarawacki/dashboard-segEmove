import { FranjaHoraria, TODAS_LAS_FRANJAS } from "../entidades/FranjaHoraria";
import { fueExitosa, Transaccion } from "../entidades/Transaccion";

/**
 * Tarjetas KPI de un dashboard de estación (réplica de las celdas A11:I24 de
 * cada hoja "Dashboard <Estación>" del Excel). El margen neto NO se calcula
 * aquí: lo agrega el caso de uso combinando esto con `EstrategiaTarifaUTE`.
 */
export interface KpisEstacion {
  readonly kwhVendidos: number;
  readonly ingresoVentaEnergiaUyu: number;
  readonly ingresoCargoFijoUyu: number;
  readonly ingresoTotalUyu: number;
  readonly ingresoTotalUsd: number;
  readonly duracionTotalHoras: number;
  readonly transaccionesExitosas: number;
  readonly intentosFallidos: number;
  readonly porcentajeFallas: number;
  readonly factorUsoDiarioHoras: number;
}

export function calcularKpisEstacion(
  transaccionesFiltradas: readonly Transaccion[],
  diasDelRango: number,
  tipoCambioUyuUsd: number,
): KpisEstacion {
  const kwhVendidos = sumar(transaccionesFiltradas, (t) => t.energiaKwh);
  const ingresoVentaEnergiaUyu = sumar(transaccionesFiltradas, (t) => t.venta);
  const ingresoCargoFijoUyu = sumar(transaccionesFiltradas, (t) => t.fijo);
  const ingresoTotalUyu = ingresoVentaEnergiaUyu + ingresoCargoFijoUyu;
  const duracionTotalHoras = sumar(transaccionesFiltradas, (t) => t.duracionMinutos) / 60;
  const transaccionesExitosas = transaccionesFiltradas.filter(fueExitosa).length;
  const intentosFallidos = transaccionesFiltradas.length - transaccionesExitosas;
  const totalIntentos = transaccionesExitosas + intentosFallidos;

  return {
    kwhVendidos,
    ingresoVentaEnergiaUyu,
    ingresoCargoFijoUyu,
    ingresoTotalUyu,
    ingresoTotalUsd: ingresoTotalUyu / tipoCambioUyuUsd,
    duracionTotalHoras,
    transaccionesExitosas,
    intentosFallidos,
    porcentajeFallas: totalIntentos === 0 ? 0 : intentosFallidos / totalIntentos,
    factorUsoDiarioHoras: duracionTotalHoras / diasDelRango,
  };
}

/** Una fila de la tabla "Distribución por franja horaria" del Excel. */
export interface DistribucionFranja {
  readonly franjaHoraria: FranjaHoraria;
  readonly kwhVendidos: number;
  readonly ingresoUyu: number;
  readonly ingresoUsd: number;
  readonly porcentajeDelTotalKwh: number;
}

export function calcularDistribucionPorFranja(
  transaccionesFiltradasPorFecha: readonly Transaccion[],
  tipoCambioUyuUsd: number,
): DistribucionFranja[] {
  const kwhTotal = sumar(transaccionesFiltradasPorFecha, (t) => t.energiaKwh);

  return TODAS_LAS_FRANJAS.map((franja) => {
    const transaccionesDeLaFranja = transaccionesFiltradasPorFecha.filter(
      (t) => t.franjaHoraria === franja,
    );
    const kwhVendidos = sumar(transaccionesDeLaFranja, (t) => t.energiaKwh);
    const ingresoUyu = sumar(transaccionesDeLaFranja, (t) => t.venta + t.fijo);

    return {
      franjaHoraria: franja,
      kwhVendidos,
      ingresoUyu,
      ingresoUsd: ingresoUyu / tipoCambioUyuUsd,
      porcentajeDelTotalKwh: kwhTotal === 0 ? 0 : kwhVendidos / kwhTotal,
    };
  });
}

function sumar<T>(items: readonly T[], obtenerValor: (item: T) => number): number {
  return items.reduce((acumulado, item) => acumulado + obtenerValor(item), 0);
}
