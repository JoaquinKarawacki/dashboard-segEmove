import { FranjaHoraria, TODAS_LAS_FRANJAS } from "../entidades/FranjaHoraria";
import { Transaccion } from "../entidades/Transaccion";

/**
 * Una fila de la tabla "Evolución mensual por franja horaria". En el Excel
 * original eran 3 columnas fijas (Junio/Julio/Agosto) porque el histórico
 * era acotado; como ahora los datos se acumulan mes a mes, se agrupa
 * dinámicamente por año-mes en vez de tener meses hardcodeados.
 */
export interface EvolucionMensual {
  readonly anio: number;
  readonly mes: number;
  readonly kwhPorFranja: Readonly<Record<FranjaHoraria, number>>;
  readonly kwhTotal: number;
}

export function calcularEvolucionMensual(
  todasLasTransaccionesDeLaEstacion: readonly Transaccion[],
): EvolucionMensual[] {
  const gruposPorMes = agruparPorAnioMes(todasLasTransaccionesDeLaEstacion);

  return Array.from(gruposPorMes.entries())
    .map(([claveAnioMes, transaccionesDelMes]) => {
      const [anio, mes] = claveAnioMes.split("-").map(Number) as [number, number];
      const kwhPorFranja = TODAS_LAS_FRANJAS.reduce(
        (acumulado, franja) => ({
          ...acumulado,
          [franja]: sumarEnergiaDeFranja(transaccionesDelMes, franja),
        }),
        {} as Record<FranjaHoraria, number>,
      );

      return {
        anio,
        mes,
        kwhPorFranja,
        kwhTotal: TODAS_LAS_FRANJAS.reduce((acumulado, franja) => acumulado + kwhPorFranja[franja], 0),
      };
    })
    .sort((a, b) => a.anio - b.anio || a.mes - b.mes);
}

function agruparPorAnioMes(
  transacciones: readonly Transaccion[],
): Map<string, Transaccion[]> {
  const grupos = new Map<string, Transaccion[]>();

  for (const transaccion of transacciones) {
    const clave = `${transaccion.anio}-${transaccion.mes}`;
    const grupoExistente = grupos.get(clave);
    if (grupoExistente) {
      grupoExistente.push(transaccion);
    } else {
      grupos.set(clave, [transaccion]);
    }
  }

  return grupos;
}

function sumarEnergiaDeFranja(transacciones: readonly Transaccion[], franja: FranjaHoraria): number {
  return transacciones
    .filter((t) => t.franjaHoraria === franja)
    .reduce((acumulado, t) => acumulado + t.energiaKwh, 0);
}
