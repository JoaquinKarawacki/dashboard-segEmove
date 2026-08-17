import { RepositorioTransacciones } from "../puertos/RepositorioTransacciones";

/**
 * Caso de uso: la fecha más antigua y más reciente entre todas las
 * transacciones cargadas — se usa para inicializar el filtro de fechas del
 * front con el "rango completo disponible", igual que el mensaje que muestra
 * el Excel debajo de los selectores de fecha.
 */
export class ObtenerRangoDeFechasDisponibleCasoUso {
  constructor(private readonly repositorioTransacciones: RepositorioTransacciones) {}

  async ejecutar(): Promise<{ minima: Date; maxima: Date } | null> {
    return this.repositorioTransacciones.obtenerRangoDeFechasDisponible();
  }
}
