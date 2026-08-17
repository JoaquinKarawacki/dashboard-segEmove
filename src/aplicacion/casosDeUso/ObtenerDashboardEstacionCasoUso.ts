import { buscarEstacionPorSlug, Estacion } from "@/dominio/entidades/Estacion";
import { FranjaHoraria, TODAS_LAS_FRANJAS } from "@/dominio/entidades/FranjaHoraria";
import { RangoFechas } from "@/dominio/entidades/RangoFechas";
import {
  calcularDistribucionPorFranja,
  calcularKpisEstacion,
  DistribucionFranja,
  KpisEstacion,
} from "@/dominio/servicios/CalculadoraKpis";
import {
  calcularEvolucionMensual,
  EvolucionMensual,
} from "@/dominio/servicios/CalculadoraEvolucionMensual";
import {
  EstrategiaTarifaUTE,
  ResultadoCalculoMargen,
} from "@/dominio/servicios/EstrategiaTarifaUTE";
import { filtrarTransacciones } from "@/dominio/servicios/FiltroTransacciones";
import { RepositorioTransacciones } from "../puertos/RepositorioTransacciones";

export interface ParametrosDashboardEstacion {
  readonly slugEstacion: string;
  readonly rango: RangoFechas;
  readonly franjaHoraria: FranjaHoraria | null;
  readonly tipoCambioUyuUsd: number;
}

export interface DashboardEstacion {
  readonly estacion: Estacion;
  readonly kpis: KpisEstacion;
  readonly margen: ResultadoCalculoMargen;
  readonly distribucionPorFranja: DistribucionFranja[];
  readonly evolucionMensual: EvolucionMensual[];
}

export class ErrorEstacionNoEncontrada extends Error {
  constructor(slug: string) {
    super(`No existe ninguna estación con el identificador "${slug}".`);
    this.name = "ErrorEstacionNoEncontrada";
  }
}

/**
 * Caso de uso: réplica de una hoja "Dashboard <Estación>" del Excel. Orquesta
 * el dominio (filtro, KPIs, distribución por franja, evolución mensual,
 * margen UTE) con los datos que trae el repositorio — no contiene ninguna
 * regla de negocio propia.
 */
export class ObtenerDashboardEstacionCasoUso {
  constructor(
    private readonly repositorioTransacciones: RepositorioTransacciones,
    private readonly estrategiaTarifaUTE: EstrategiaTarifaUTE,
  ) {}

  async ejecutar(parametros: ParametrosDashboardEstacion): Promise<DashboardEstacion> {
    const estacion = buscarEstacionPorSlug(parametros.slugEstacion);
    if (!estacion) {
      throw new ErrorEstacionNoEncontrada(parametros.slugEstacion);
    }

    const todasLasTransaccionesDeLaEstacion = await this.repositorioTransacciones.buscarPorEstacion(
      estacion.codigo,
    );

    const transaccionesFiltradas = filtrarTransacciones(todasLasTransaccionesDeLaEstacion, {
      codigoEstacion: estacion.codigo,
      rango: parametros.rango,
      franjaHoraria: parametros.franjaHoraria,
    });

    // La distribución por franja y el margen UTE siempre desagregan las 3
    // franjas, sin importar el filtro de franja elegido en la UI — igual que
    // en el Excel original.
    const transaccionesDelRangoSinFiltroDeFranja = filtrarTransacciones(
      todasLasTransaccionesDeLaEstacion,
      { codigoEstacion: estacion.codigo, rango: parametros.rango, franjaHoraria: null },
    );

    const diasDelRango = calcularCantidadDeDias(parametros.rango);

    const kpis = calcularKpisEstacion(
      transaccionesFiltradas,
      diasDelRango,
      parametros.tipoCambioUyuUsd,
    );

    const distribucionPorFranja = calcularDistribucionPorFranja(
      transaccionesDelRangoSinFiltroDeFranja,
      parametros.tipoCambioUyuUsd,
    );

    const kwhPorFranja = TODAS_LAS_FRANJAS.reduce(
      (acumulado, franja) => ({
        ...acumulado,
        [franja]: distribucionPorFranja.find((d) => d.franjaHoraria === franja)?.kwhVendidos ?? 0,
      }),
      {} as Record<FranjaHoraria, number>,
    );

    const margen = this.estrategiaTarifaUTE.calcularMargen({
      kwhPorFranja,
      ingresoTotalUyu: kpis.ingresoTotalUyu,
      diasDelRango,
    });

    const evolucionMensual = calcularEvolucionMensual(todasLasTransaccionesDeLaEstacion);

    return { estacion, kpis, margen, distribucionPorFranja, evolucionMensual };
  }
}

function calcularCantidadDeDias(rango: RangoFechas): number {
  const unDiaEnMilisegundos = 1000 * 60 * 60 * 24;
  const diferenciaEnDias = Math.round(
    (rango.hasta.getTime() - rango.desde.getTime()) / unDiaEnMilisegundos,
  );
  return Math.max(diferenciaEnDias + 1, 1);
}
