import { Estacion, ESTACIONES } from "@/dominio/entidades/Estacion";
import { Transaccion } from "@/dominio/entidades/Transaccion";
import { RepositorioTransacciones } from "../puertos/RepositorioTransacciones";

/**
 * Fila de la tabla "Total histórico" del Excel: acumulado de todo el histórico
 * (sin filtrar por fecha) de un cargador. Los importes son BRUTOS (con IVA),
 * tal como se recaudaron — a diferencia del resto del dashboard, que reporta
 * netos. Fórmulas tomadas literalmente de las hojas mensuales del Excel.
 */
export interface HistoricoEstacion {
  readonly estacion: Estacion;
  readonly kwhVendidos: number;
  /** Σ Fijo ($), bruto. */
  readonly ventaCostoFijo: number;
  /** Σ Venta ($), bruto. */
  readonly ventaEnergia: number;
  /** Σ Total ($), bruto. */
  readonly totalRecaudado: number;
  readonly duracionHoras: number;
  /**
   * Días del calendario con al menos una transacción incluida (no excluida).
   * Es el divisor por defecto del "Factor de uso diario" — derivado de los
   * datos, no hardcodeado. En el Excel ese divisor se cargaba a mano por mes
   * (los días que el cargador estuvo activo); acá se usa este valor como base
   * y la presentación permite ajustarlo por estación.
   */
  readonly diasConActividad: number;
  /** Transacciones con potencia real de carga (> 0 kW). */
  readonly transaccionesExitosas: number;
  /** Intentos con potencia = 0 kW. */
  readonly intentosFallidos: number;
  /** Sesiones con energía > 0 y duración > 1 minuto (COUNTIFS del Excel). */
  readonly flujoUsuarios: number;
}

/**
 * Caso de uso: réplica de la hoja "Total histórico" del Excel. Devuelve, por
 * cada cargador, el acumulado de todo el histórico cargado en la base.
 */
export class ObtenerHistoricoFlotaCasoUso {
  constructor(private readonly repositorioTransacciones: RepositorioTransacciones) {}

  async ejecutar(): Promise<HistoricoEstacion[]> {
    return Promise.all(
      ESTACIONES.map(async (estacion) => {
        const transacciones = (
          await this.repositorioTransacciones.buscarPorEstacion(estacion.codigo)
        ).filter((t) => !t.excluir);
        return calcularHistorico(estacion, transacciones);
      }),
    );
  }
}

function calcularHistorico(estacion: Estacion, transacciones: readonly Transaccion[]): HistoricoEstacion {
  const kwhVendidos = sumar(transacciones, (t) => t.energiaKwh);
  const ventaCostoFijo = sumar(transacciones, (t) => t.fijo);
  const ventaEnergia = sumar(transacciones, (t) => t.venta);
  const totalRecaudado = sumar(transacciones, (t) => t.total);
  const duracionHoras = sumar(transacciones, (t) => t.duracionMinutos) / 60;

  return {
    estacion,
    kwhVendidos,
    ventaCostoFijo,
    ventaEnergia,
    totalRecaudado,
    duracionHoras,
    diasConActividad: contarDiasConActividad(transacciones),
    transaccionesExitosas: transacciones.filter((t) => t.potenciaKw > 0).length,
    intentosFallidos: transacciones.filter((t) => t.potenciaKw === 0).length,
    flujoUsuarios: transacciones.filter((t) => t.energiaKwh > 0 && t.duracionMinutos > 1).length,
  };
}

/** Cuenta los días distintos del calendario (año-mes-día) que tuvieron actividad. */
function contarDiasConActividad(transacciones: readonly Transaccion[]): number {
  const dias = new Set(
    transacciones.map(
      (t) => `${t.fechaInicio.getFullYear()}-${t.fechaInicio.getMonth()}-${t.fechaInicio.getDate()}`,
    ),
  );
  return dias.size;
}

function sumar(items: readonly Transaccion[], obtener: (t: Transaccion) => number): number {
  return items.reduce((acumulado, item) => acumulado + obtener(item), 0);
}
