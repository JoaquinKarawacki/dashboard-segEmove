import { Transaccion } from "@/dominio/entidades/Transaccion";

/**
 * Puerto (interfaz) que define cómo la capa de aplicación accede a las
 * transacciones, sin saber si están en PostgreSQL, en memoria o en cualquier
 * otro lado. La implementación concreta vive en `infraestructura/`.
 * Patrón Repository: desacopla el dominio/aplicación del motor de persistencia.
 */
export interface RepositorioTransacciones {
  /**
   * Inserta o actualiza transacciones según su `idTransaccion` (upsert).
   * Así es como se acumulan los datos cada vez que se sube un Excel nuevo,
   * sin duplicar filas si una transacción ya existía.
   */
  guardarOActualizar(transacciones: readonly Transaccion[]): Promise<void>;

  /** Todas las transacciones de una estación (sin filtrar por fecha ni franja). */
  buscarPorEstacion(codigoEstacion: string): Promise<Transaccion[]>;

  /** Todas las transacciones cargadas, de cualquier estación. */
  buscarTodas(): Promise<Transaccion[]>;

  /** Fecha más antigua y más reciente entre todas las transacciones cargadas. */
  obtenerRangoDeFechasDisponible(): Promise<{ minima: Date; maxima: Date } | null>;
}
