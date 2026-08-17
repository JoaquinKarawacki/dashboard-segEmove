import { ESTACIONES, Estacion } from "@/dominio/entidades/Estacion";
import { FranjaHoraria, TODAS_LAS_FRANJAS } from "@/dominio/entidades/FranjaHoraria";
import { RangoFechas } from "@/dominio/entidades/RangoFechas";
import { filtrarTransacciones } from "@/dominio/servicios/FiltroTransacciones";
import { RepositorioTransacciones } from "../puertos/RepositorioTransacciones";

export interface ParametrosResumenGeneral {
  readonly rango: RangoFechas;
}

/** Comparación entre estaciones para una misma franja (réplica de la hoja "Franjas Horarias"). */
export interface FilaComparacionEstaciones {
  readonly estacion: Estacion;
  readonly kwhPorFranja: Readonly<Record<FranjaHoraria, number>>;
  readonly kwhTotal: number;
}

/**
 * Caso de uso: réplica de la hoja "Franjas Horarias" del Excel — compara las
 * 3 estaciones entre sí para el rango de fechas elegido.
 */
export class ObtenerResumenGeneralCasoUso {
  constructor(private readonly repositorioTransacciones: RepositorioTransacciones) {}

  async ejecutar(parametros: ParametrosResumenGeneral): Promise<FilaComparacionEstaciones[]> {
    const todasLasTransacciones = await this.repositorioTransacciones.buscarTodas();

    return ESTACIONES.map((estacion) => {
      const transaccionesDeLaEstacion = filtrarTransacciones(todasLasTransacciones, {
        codigoEstacion: estacion.codigo,
        rango: parametros.rango,
        franjaHoraria: null,
      });

      const kwhPorFranja = TODAS_LAS_FRANJAS.reduce(
        (acumulado, franja) => ({
          ...acumulado,
          [franja]: transaccionesDeLaEstacion
            .filter((t) => t.franjaHoraria === franja)
            .reduce((suma, t) => suma + t.energiaKwh, 0),
        }),
        {} as Record<FranjaHoraria, number>,
      );

      const kwhTotal = TODAS_LAS_FRANJAS.reduce((suma, franja) => suma + kwhPorFranja[franja], 0);

      return { estacion, kwhPorFranja, kwhTotal };
    });
  }
}
