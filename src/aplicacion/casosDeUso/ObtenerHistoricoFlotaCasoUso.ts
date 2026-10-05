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
  /** Duración (h) / 30, igual que el Excel (sumatoria mensual con base de 30 días). */
  readonly factorUsoDiario: number;
  /** Transacciones con potencia real de carga (> 0 kW). */
  readonly transaccionesExitosas: number;
  /** Intentos con potencia = 0 kW. */
  readonly intentosFallidos: number;
  /** Sesiones con energía > 0 y duración > 1 minuto (COUNTIFS del Excel). */
  readonly flujoUsuarios: number;
}

const DIAS_PERIODO_REFERENCIA = 30;

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
    factorUsoDiario: duracionHoras / DIAS_PERIODO_REFERENCIA,
    transaccionesExitosas: transacciones.filter((t) => t.potenciaKw > 0).length,
    intentosFallidos: transacciones.filter((t) => t.potenciaKw === 0).length,
    flujoUsuarios: transacciones.filter((t) => t.energiaKwh > 0 && t.duracionMinutos > 1).length,
  };
}

function sumar(items: readonly Transaccion[], obtener: (t: Transaccion) => number): number {
  return items.reduce((acumulado, item) => acumulado + obtener(item), 0);
}
