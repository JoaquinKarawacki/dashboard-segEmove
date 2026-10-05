import { DashboardEstacion } from "@/aplicacion/casosDeUso/ObtenerDashboardEstacionCasoUso";
import { DistribucionFranja, KpisEstacion } from "@/dominio/servicios/CalculadoraKpis";
import { ResultadoCalculoMargen } from "@/dominio/servicios/EstrategiaTarifaUTE";
import { EvolucionMensual } from "@/dominio/servicios/CalculadoraEvolucionMensual";
import { FranjaHoraria, TODAS_LAS_FRANJAS } from "@/dominio/entidades/FranjaHoraria";

export interface DashboardAgregado {
  readonly kpis: KpisEstacion;
  readonly margen: ResultadoCalculoMargen;
  readonly distribucionPorFranja: DistribucionFranja[];
  readonly evolucionMensual: EvolucionMensual[];
}

/**
 * Combina los dashboards de varias estaciones en uno solo (alcance "Todos"),
 * sumando las magnitudes y recomputando los porcentajes. Con una sola estación
 * devuelve lo mismo que entró, así la vista usa siempre el mismo camino.
 */
export function agregarDashboards(dashboards: readonly DashboardEstacion[]): DashboardAgregado {
  const cantidad = Math.max(dashboards.length, 1);

  const kpisSumados = dashboards.reduce(
    (acum, d) => ({
      kwhVendidos: acum.kwhVendidos + d.kpis.kwhVendidos,
      ingresoVentaEnergiaUyu: acum.ingresoVentaEnergiaUyu + d.kpis.ingresoVentaEnergiaUyu,
      ingresoCargoFijoUyu: acum.ingresoCargoFijoUyu + d.kpis.ingresoCargoFijoUyu,
      ingresoTotalUyu: acum.ingresoTotalUyu + d.kpis.ingresoTotalUyu,
      ingresoTotalUsd: acum.ingresoTotalUsd + d.kpis.ingresoTotalUsd,
      duracionTotalHoras: acum.duracionTotalHoras + d.kpis.duracionTotalHoras,
      transaccionesExitosas: acum.transaccionesExitosas + d.kpis.transaccionesExitosas,
      intentosFallidos: acum.intentosFallidos + d.kpis.intentosFallidos,
      factorUso: acum.factorUso + d.kpis.factorUsoDiarioHoras,
    }),
    {
      kwhVendidos: 0,
      ingresoVentaEnergiaUyu: 0,
      ingresoCargoFijoUyu: 0,
      ingresoTotalUyu: 0,
      ingresoTotalUsd: 0,
      duracionTotalHoras: 0,
      transaccionesExitosas: 0,
      intentosFallidos: 0,
      factorUso: 0,
    },
  );

  const totalIntentos = kpisSumados.transaccionesExitosas + kpisSumados.intentosFallidos;

  const kpis: KpisEstacion = {
    kwhVendidos: kpisSumados.kwhVendidos,
    ingresoVentaEnergiaUyu: kpisSumados.ingresoVentaEnergiaUyu,
    ingresoCargoFijoUyu: kpisSumados.ingresoCargoFijoUyu,
    ingresoTotalUyu: kpisSumados.ingresoTotalUyu,
    ingresoTotalUsd: kpisSumados.ingresoTotalUsd,
    duracionTotalHoras: kpisSumados.duracionTotalHoras,
    transaccionesExitosas: kpisSumados.transaccionesExitosas,
    intentosFallidos: kpisSumados.intentosFallidos,
    porcentajeFallas: totalIntentos === 0 ? 0 : kpisSumados.intentosFallidos / totalIntentos,
    // Promedio por cargador, igual que el mockup (S.dur / nDays / cantidad).
    factorUsoDiarioHoras: kpisSumados.factorUso / cantidad,
  };

  const margen: ResultadoCalculoMargen = dashboards.reduce(
    (acum, d) => ({
      costoTotalUte: acum.costoTotalUte + d.margen.costoTotalUte,
      costoGestionEve: acum.costoGestionEve + d.margen.costoGestionEve,
      costoSim4g: acum.costoSim4g + d.margen.costoSim4g,
      margenNetoUyu: acum.margenNetoUyu + d.margen.margenNetoUyu,
    }),
    { costoTotalUte: 0, costoGestionEve: 0, costoSim4g: 0, margenNetoUyu: 0 },
  );

  const distribucionPorFranja = agregarDistribucion(dashboards);
  const evolucionMensual = agregarEvolucion(dashboards);

  return { kpis, margen, distribucionPorFranja, evolucionMensual };
}

function agregarDistribucion(dashboards: readonly DashboardEstacion[]): DistribucionFranja[] {
  const porFranja = TODAS_LAS_FRANJAS.map((franja) => {
    let kwhVendidos = 0;
    let ingresoUyu = 0;
    let ingresoUsd = 0;
    for (const d of dashboards) {
      const fila = d.distribucionPorFranja.find((f) => f.franjaHoraria === franja);
      if (!fila) continue;
      kwhVendidos += fila.kwhVendidos;
      ingresoUyu += fila.ingresoUyu;
      ingresoUsd += fila.ingresoUsd;
    }
    return { franjaHoraria: franja, kwhVendidos, ingresoUyu, ingresoUsd };
  });

  const kwhTotal = porFranja.reduce((acum, f) => acum + f.kwhVendidos, 0);

  return porFranja.map((f) => ({
    ...f,
    porcentajeDelTotalKwh: kwhTotal === 0 ? 0 : f.kwhVendidos / kwhTotal,
  }));
}

function agregarEvolucion(dashboards: readonly DashboardEstacion[]): EvolucionMensual[] {
  const porMes = new Map<string, EvolucionMensual>();

  for (const d of dashboards) {
    for (const fila of d.evolucionMensual) {
      const clave = `${fila.anio}-${fila.mes}`;
      const existente = porMes.get(clave);
      if (!existente) {
        porMes.set(clave, {
          anio: fila.anio,
          mes: fila.mes,
          kwhPorFranja: { ...fila.kwhPorFranja },
          kwhTotal: fila.kwhTotal,
        });
      } else {
        const kwhPorFranja = { ...existente.kwhPorFranja } as Record<FranjaHoraria, number>;
        for (const franja of TODAS_LAS_FRANJAS) {
          kwhPorFranja[franja] += fila.kwhPorFranja[franja];
        }
        porMes.set(clave, {
          anio: fila.anio,
          mes: fila.mes,
          kwhPorFranja,
          kwhTotal: existente.kwhTotal + fila.kwhTotal,
        });
      }
    }
  }

  return Array.from(porMes.values()).sort((a, b) => a.anio - b.anio || a.mes - b.mes);
}
