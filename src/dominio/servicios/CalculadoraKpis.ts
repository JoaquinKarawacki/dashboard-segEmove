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
  iva: number,
): KpisEstacion {
  const kwhVendidos = sumar(transaccionesFiltradas, (t) => t.energiaKwh);
  // Los importes del Panel vienen con IVA incluido; el dashboard los reporta netos.
  const ingresoVentaEnergiaUyu = sumar(transaccionesFiltradas, (t) => t.venta) / (1 + iva);
  const ingresoCargoFijoUyu = sumar(transaccionesFiltradas, (t) => t.fijo) / (1 + iva);
  const ingresoTotalUyu = ingresoVentaEnergiaUyu + ingresoCargoFijoUyu;
  const duracionTotalHoras = sumar(transaccionesFiltradas, (t) => t.duracionMinutos) / 60;
  // Exitosas / fallidas EXACTAMENTE como la hoja "Dashboard <Estación>" del Excel
  // (celdas B20/F20): exitosas = transacciones con potencia > 0 MENOS las "filas
  // fantasma" (potencia 1 kW con todo lo demás en cero); fallidos = potencia = 0.
  // El % de fallas se calcula sobre exitosas + fallidos (NO sobre el total de filas).
  const transaccionesConPotencia = transaccionesFiltradas.filter(fueExitosa).length;
  const intentosFantasma = transaccionesFiltradas.filter(esIntentoFantasma).length;
  const transaccionesExitosas = transaccionesConPotencia - intentosFantasma;
  const intentosFallidos = transaccionesFiltradas.filter((t) => t.potenciaKw === 0).length;
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
  iva: number,
): DistribucionFranja[] {
  const kwhTotal = sumar(transaccionesFiltradasPorFecha, (t) => t.energiaKwh);

  return TODAS_LAS_FRANJAS.map((franja) => {
    const transaccionesDeLaFranja = transaccionesFiltradasPorFecha.filter(
      (t) => t.franjaHoraria === franja,
    );
    const kwhVendidos = sumar(transaccionesDeLaFranja, (t) => t.energiaKwh);
    // Ingreso neto de IVA, igual que en los KPIs.
    const ingresoUyu = sumar(transaccionesDeLaFranja, (t) => t.venta + t.fijo) / (1 + iva);

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

/**
 * "Fila fantasma" del Excel: un registro con potencia de exactamente 1 kW y
 * energía, compra, fijo, venta y total en cero. El Excel la descuenta de las
 * transacciones exitosas (no es una carga real) y tampoco la cuenta como
 * fallida — por eso no entra en el denominador del % de fallas.
 */
function esIntentoFantasma(t: Transaccion): boolean {
  return (
    t.potenciaKw === 1 &&
    t.energiaKwh === 0 &&
    t.compra === 0 &&
    t.fijo === 0 &&
    t.venta === 0 &&
    t.total === 0
  );
}
