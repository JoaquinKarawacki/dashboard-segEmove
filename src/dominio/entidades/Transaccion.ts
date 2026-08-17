import { FranjaHoraria, calcularFranjaHoraria } from "./FranjaHoraria";

/**
 * Una transacción de carga (una fila de la hoja de datos del Excel). Los campos
 * que en el Excel se calculaban con fórmulas (mes, año, franja horaria) se
 * calculan aquí con `crearTransaccion`, a partir de los campos crudos.
 */
export interface Transaccion {
  readonly idTransaccion: string;
  readonly cargador: string;
  readonly conector: string | null;
  readonly tag: string | null;
  readonly usuario: string | null;
  readonly fechaInicio: Date;
  readonly fechaFin: Date | null;
  readonly potenciaKw: number;
  readonly energiaKwh: number;
  readonly compra: number;
  readonly fijo: number;
  readonly permanencia: number;
  readonly venta: number;
  readonly descuento: number;
  readonly total: number;
  readonly duracionMinutos: number;
  readonly excluir: boolean;
  // Derivados (calculados al crear la transacción, no vienen del Excel):
  readonly mes: number;
  readonly anio: number;
  readonly franjaHoraria: FranjaHoraria;
}

/**
 * Datos crudos de una transacción, tal como se leen del Excel (sin los
 * campos derivados). Los recibe el `ParseadorExcel` de infraestructura.
 */
export type DatosCrudosTransaccion = Omit<
  Transaccion,
  "mes" | "anio" | "franjaHoraria"
>;

/** Una transacción se considera exitosa si tuvo potencia real de carga (> 0 kW). */
export function fueExitosa(transaccion: Transaccion): boolean {
  return transaccion.potenciaKw > 0;
}

export function crearTransaccion(datos: DatosCrudosTransaccion): Transaccion {
  return {
    ...datos,
    mes: datos.fechaInicio.getMonth() + 1,
    anio: datos.fechaInicio.getFullYear(),
    franjaHoraria: calcularFranjaHoraria(datos.fechaInicio.getHours()),
  };
}
